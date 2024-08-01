import browser from "webextension-polyfill";

const executeScriptOnTabId = (tabId: number) => {
  browser.scripting
    .executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    })
    .catch((err) => {
      console.error("Error executing script", err);
    });
};

const contexts: browser.Menus.ContextType[] = [
  "all",
  "page",
  "frame",
  "selection",
  "link",
  "editable",
  "image",
  "video",
  "audio",
];

browser.contextMenus.create({
  contexts: contexts,
  title: "Picture-in-Picture Anything",
  id: "open-pip",
});

browser.contextMenus.onClicked.addListener((_, tab) => {
  const tabId = tab?.id;
  if (!tabId) {
    return;
  }
  executeScriptOnTabId(tabId);
});

browser.commands.onCommand.addListener((command) => {
  if (command === "run-pip") {
    browser.tabs
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

browser.action.onClicked.addListener((tab) => {
  const tabId = tab.id;
  if (!tabId) {
    return;
  }
  executeScriptOnTabId(tabId);
});
