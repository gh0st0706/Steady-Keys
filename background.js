chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "open-link" && typeof message.url === "string") {
    try {
      const url = new URL(message.url);
      if (url.protocol === "http:" || url.protocol === "https:") {
        chrome.tabs.create({ url: url.href, active: message.active !== false });
      }
    } catch { /* Ignore malformed or unsupported links. */ }
  }
  if (message?.type === "switch-tab" && sender.tab?.id != null && sender.tab.windowId != null) {
    chrome.tabs.query({ windowId: sender.tab.windowId }).then((tabs) => {
      const live = tabs.filter((tab) => tab.id != null);
      const index = live.findIndex((tab) => tab.id === sender.tab.id);
      if (index < 0 || live.length < 2) return;
      const next = (index + message.direction + live.length) % live.length;
      chrome.tabs.update(live[next].id, { active: true });
    });
  }
});
