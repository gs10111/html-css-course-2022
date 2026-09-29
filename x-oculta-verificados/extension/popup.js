const DEFAULTS = {
  enabled: true,
  hideBlue: true,
  hideGold: false,
  hideGray: false,
  hideQuoted: false,
  mode: "hide",
  whitelist: [],
};

const CHECKBOXES = ["enabled", "hideBlue", "hideGold", "hideGray", "hideQuoted"];
const whitelistEl = document.getElementById("whitelist");

function save(values) {
  chrome.storage.sync.set(values);
}

chrome.storage.sync.get(DEFAULTS, (settings) => {
  for (const id of CHECKBOXES) {
    const input = document.getElementById(id);
    input.checked = settings[id];
    input.addEventListener("change", () => save({ [id]: input.checked }));
  }

  for (const radio of document.querySelectorAll('input[name="mode"]')) {
    radio.checked = radio.value === settings.mode;
    radio.addEventListener("change", () => save({ mode: radio.value }));
  }

  whitelistEl.value = settings.whitelist.map((h) => "@" + h).join("\n");
  whitelistEl.addEventListener("change", () => {
    const handles = whitelistEl.value
      .split(/[\s,]+/)
      .map((h) => h.replace(/^@/, "").toLowerCase())
      .filter(Boolean);
    save({ whitelist: [...new Set(handles)] });
  });
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { type: "hv:count" }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    document.getElementById("count").textContent = response.count;
  });
});
