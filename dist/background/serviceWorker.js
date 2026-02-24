// src/shared/config.ts
var DEFAULT_SETTINGS = {
  enabled: true,
  visualMode: "highlight",
  hudLevel: "learner",
  wrapNavigation: true,
  holePadding: 8,
  shortcuts: {
    toggleExtension: "Alt+Shift+V",
    toggleVisualMode: "Alt+Shift+O",
    toggleHudMode: "Alt+Shift+U",
    next: "Alt+Shift+ArrowDown",
    previous: "Alt+Shift+ArrowUp",
    activate: "Alt+Shift+Enter",
    toggleMode: "Alt+Shift+M",
    nextHeading: "Alt+Shift+H",
    nextLink: "Alt+Shift+K",
    nextButton: "Alt+Shift+B",
    nextField: "Alt+Shift+F",
    nextLandmark: "Alt+Shift+D"
  }
};
var STORAGE_KEY = "virtuallyBlindSettings";

// src/background/serviceWorker.ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    if (!result[STORAGE_KEY]) {
      chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    }
  });
});
chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-extension") return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, { type: "VB_TOGGLE_ENABLED" });
  });
});
