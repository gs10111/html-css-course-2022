(() => {
  const DEFAULTS = {
    enabled: true,
    hideBlue: true,
    hideGold: false,
    hideGray: false,
    hideQuoted: false,
    mode: "hide",
    whitelist: [],
  };

  const TWEET = 'article[data-testid="tweet"]';
  const USER_NAME = '[data-testid="User-Name"]';
  const BADGE = 'svg[data-testid="icon-verified"]';

  let settings = { ...DEFAULTS };
  const hiddenKeys = new Set();
  let scheduled = false;

  function badgeType(svg) {
    if (svg.querySelector("linearGradient, [fill^='url(']")) return "gold";
    const match = getComputedStyle(svg).color.match(/\d+/g);
    if (!match) return "blue";
    const [r, , b] = match.map(Number);
    return b - r > 120 ? "blue" : "gray";
  }

  function handleOf(userName) {
    for (const link of userName.querySelectorAll('a[href^="/"]')) {
      const handle = link.getAttribute("href").split("/")[1];
      if (handle) return handle.toLowerCase();
    }
    return "";
  }

  function shouldHideAuthor(userName) {
    const svg = userName.querySelector(BADGE);
    if (!svg) return null;
    const type = badgeType(svg);
    const wanted =
      (type === "blue" && settings.hideBlue) ||
      (type === "gold" && settings.hideGold) ||
      (type === "gray" && settings.hideGray);
    if (!wanted) return null;
    const handle = handleOf(userName);
    if (settings.whitelist.includes(handle)) return null;
    return handle || "?";
  }

  function tweetKey(article) {
    const link = article.querySelector('a[href*="/status/"] time')?.parentElement;
    const userName = article.querySelector(USER_NAME);
    return (link?.getAttribute("href") || "") + "|" + (userName ? handleOf(userName) : "");
  }

  function containerOf(article) {
    return article.closest('[data-testid="cellInnerDiv"]') || article;
  }

  function reset(article) {
    containerOf(article).removeAttribute("data-hv-state");
    article.removeAttribute("data-hv-state");
    article.parentElement?.querySelector(":scope > .hv-placeholder")?.remove();
  }

  function collapse(article, handle) {
    article.setAttribute("data-hv-state", "collapsed");
    const box = document.createElement("div");
    box.className = "hv-placeholder";
    const label = document.createElement("span");
    label.textContent = `Tweet de @${handle} (verificado) oculto`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Mostrar";
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      box.remove();
      article.setAttribute("data-hv-state", "revealed");
    });
    box.append(label, button);
    article.before(box);
  }

  function process(article) {
    const key = tweetKey(article);
    if (article.dataset.hvKey === key) return;
    reset(article);
    article.dataset.hvKey = key;
    if (!settings.enabled) return;

    const userNames = article.querySelectorAll(USER_NAME);
    if (!userNames.length) return;
    let handle = shouldHideAuthor(userNames[0]);
    if (!handle && settings.hideQuoted) {
      for (const userName of [...userNames].slice(1)) {
        handle = shouldHideAuthor(userName);
        if (handle) break;
      }
    }
    if (!handle) return;

    hiddenKeys.add(key);
    if (settings.mode === "collapse") collapse(article, handle);
    else containerOf(article).setAttribute("data-hv-state", "hidden");
  }

  function scan() {
    scheduled = false;
    document.querySelectorAll(TWEET).forEach(process);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  }

  function rescanAll() {
    document.querySelectorAll(TWEET).forEach((article) => {
      reset(article);
      delete article.dataset.hvKey;
    });
    hiddenKeys.clear();
    schedule();
  }

  function applySettings(stored) {
    settings = { ...DEFAULTS, ...stored };
    settings.whitelist = (settings.whitelist || []).map((h) => h.replace(/^@/, "").toLowerCase());
    rescanAll();
  }

  chrome.storage.sync.get(DEFAULTS, applySettings);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const next = { ...settings };
    for (const [name, { newValue }] of Object.entries(changes)) next[name] = newValue;
    applySettings(next);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "hv:count") sendResponse({ count: hiddenKeys.size });
  });

  new MutationObserver(schedule).observe(document, {
    childList: true,
    subtree: true,
  });
})();
