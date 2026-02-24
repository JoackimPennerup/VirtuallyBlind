import { DEFAULT_SETTINGS, STORAGE_KEY } from '../shared/config';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([STORAGE_KEY], (result: Record<string, unknown>) => {
    if (!result[STORAGE_KEY]) {
      chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    }
  });
});

chrome.commands.onCommand.addListener((command: string) => {
  if (command !== 'toggle-extension') return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, { type: 'VB_TOGGLE_ENABLED' });
  });
});
