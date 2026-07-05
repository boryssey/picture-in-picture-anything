const executeScriptOnTabId = (tabId: number) => {
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    })
    .catch((err) => {
      console.error("Error executing script", err);
    });
};

chrome.contextMenus.create({
  contexts: [
    "all",
    "page",
    "frame",
    "selection",
    "link",
    "editable",
    "image",
    "video",
    "audio",
  ],
  title: "Picture-in-Picture Anything",
  id: "open-pip",
});

chrome.contextMenus.onClicked.addListener((_, tab) => {
  const tabId = tab?.id;
  if (!tabId) {
    return;
  }
  executeScriptOnTabId(tabId);
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "run-pip") {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const tab = tabs[0];
        if (!tab) {
          return;
        }
        const tabId = tab.id;
        if (!tabId) {
          return;
        }
        executeScriptOnTabId(tabId);
      })
      .catch((err) => {
        console.error("Error querying tabs", err);
      });
  }
});

chrome.action.onClicked.addListener((tab) => {
  const tabId = tab.id;
  if (!tabId) {
    return;
  }
  executeScriptOnTabId(tabId);
});
