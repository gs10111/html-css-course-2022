const CSS = `
[data-hv-state="hidden"] { display: none !important; }
article[data-hv-state="collapsed"] > * { display: none !important; }
.hv-placeholder {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 16px; font: 14px/1.4 -apple-system, Roboto, sans-serif;
  color: rgb(113, 118, 123); border-bottom: 1px solid rgba(113, 118, 123, 0.3);
}
.hv-placeholder button {
  flex-shrink: 0; padding: 4px 12px; font: inherit; font-weight: 700;
  color: rgb(29, 155, 240); background: transparent;
  border: 1px solid rgba(29, 155, 240, 0.5); border-radius: 999px;
}
`;

const CORE = `
(function () {
  var TWEET = 'article[data-testid="tweet"]';
  var USER_NAME = '[data-testid="User-Name"]';
  var BADGE = 'svg[data-testid="icon-verified"]';
  var settings = {};
  var hiddenKeys = new Set();
  var scheduled = false;
  var lastCount = -1;

  function post(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  function badgeType(svg) {
    if (svg.querySelector("linearGradient, [fill^='url(']")) return "gold";
    var match = getComputedStyle(svg).color.match(/\\d+/g);
    if (!match) return "blue";
    return Number(match[2]) - Number(match[0]) > 120 ? "blue" : "gray";
  }

  function handleOf(userName) {
    var links = userName.querySelectorAll('a[href^="/"]');
    for (var i = 0; i < links.length; i++) {
      var handle = links[i].getAttribute("href").split("/")[1];
      if (handle) return handle.toLowerCase();
    }
    return "";
  }

  function shouldHideAuthor(userName) {
    var svg = userName.querySelector(BADGE);
    if (!svg) return null;
    var type = badgeType(svg);
    var wanted =
      (type === "blue" && settings.hideBlue) ||
      (type === "gold" && settings.hideGold) ||
      (type === "gray" && settings.hideGray);
    if (!wanted) return null;
    var handle = handleOf(userName);
    if (settings.whitelist.indexOf(handle) !== -1) return null;
    return handle || "?";
  }

  function tweetKey(article) {
    var time = article.querySelector('a[href*="/status/"] time');
    var userName = article.querySelector(USER_NAME);
    return ((time && time.parentElement.getAttribute("href")) || "") + "|" + (userName ? handleOf(userName) : "");
  }

  function containerOf(article) {
    return article.closest('[data-testid="cellInnerDiv"]') || article;
  }

  function reset(article) {
    containerOf(article).removeAttribute("data-hv-state");
    article.removeAttribute("data-hv-state");
    var placeholder = article.parentElement && article.parentElement.querySelector(":scope > .hv-placeholder");
    if (placeholder) placeholder.remove();
  }

  function collapse(article, handle) {
    article.setAttribute("data-hv-state", "collapsed");
    var box = document.createElement("div");
    box.className = "hv-placeholder";
    var label = document.createElement("span");
    label.textContent = "Tweet de @" + handle + " (verificado) oculto";
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = "Mostrar";
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      box.remove();
      article.setAttribute("data-hv-state", "revealed");
    });
    box.append(label, button);
    article.before(box);
  }

  function process(article) {
    var key = tweetKey(article);
    if (article.dataset.hvKey === key) return;
    reset(article);
    article.dataset.hvKey = key;
    if (!settings.enabled) return;

    var userNames = article.querySelectorAll(USER_NAME);
    if (!userNames.length) return;
    var handle = shouldHideAuthor(userNames[0]);
    for (var i = 1; !handle && settings.hideQuoted && i < userNames.length; i++) {
      handle = shouldHideAuthor(userNames[i]);
    }
    if (!handle) return;

    hiddenKeys.add(key);
    if (settings.mode === "collapse") collapse(article, handle);
    else containerOf(article).setAttribute("data-hv-state", "hidden");
  }

  function scan() {
    scheduled = false;
    document.querySelectorAll(TWEET).forEach(process);
    if (hiddenKeys.size !== lastCount) {
      lastCount = hiddenKeys.size;
      post({ type: "count", count: lastCount });
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  }

  function injectStyle() {
    var parent = document.head || document.documentElement;
    if (!parent || document.getElementById("hv-style")) return;
    var style = document.createElement("style");
    style.id = "hv-style";
    style.textContent = __CSS__;
    parent.appendChild(style);
  }

  window.__hvApply = function (next) {
    settings = next;
    settings.whitelist = (settings.whitelist || []).map(function (h) {
      return h.replace(/^@/, "").toLowerCase();
    });
    document.querySelectorAll(TWEET).forEach(function (article) {
      reset(article);
      delete article.dataset.hvKey;
    });
    hiddenKeys.clear();
    lastCount = -1;
    injectStyle();
    schedule();
  };

  window.__hvApply(__SETTINGS__);
  new MutationObserver(function () {
    injectStyle();
    schedule();
  }).observe(document, { childList: true, subtree: true });
})();
`;

export function buildInjectedScript(settings) {
  const json = JSON.stringify(settings);
  return `
if (window.__hvApply) { window.__hvApply(${json}); }
else {${CORE.replace("__CSS__", () => JSON.stringify(CSS)).replace("__SETTINGS__", () => json)}}
true;
`;
}

export function buildApplyScript(settings) {
  return `window.__hvApply && window.__hvApply(${JSON.stringify(settings)}); true;`;
}
