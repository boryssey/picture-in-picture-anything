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

  if (__BROWSER__ === "firefox") {
    // Firefox runs PiP creation in the page's MAIN world (see pip-main.ts).
    browser.scripting
      .executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        files: ["pip-main.js"],
      })
      .catch((err) => {
        console.error("Error injecting MAIN-world PiP script", err);
      });
  }
};

browser.contextMenus.create({
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
