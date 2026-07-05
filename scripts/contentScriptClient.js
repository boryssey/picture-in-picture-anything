import browser from "webextension-polyfill";

const logger = (msg) => {
  console.log(`[CSC] ${msg}`);
};

logger("content script client up.");

browser.runtime.onMessage.addListener((request) => {
  const shouldReload =
    request.from === "backgroundClient" && request.action === "reload-yourself";
  if (shouldReload) {
    // wait 100ms for extension reload.
    logger("page will reload to reload content script...");
    setTimeout(() => window.location.reload(), 100);
    return Promise.resolve({ from: "contentScriptClient", action: "yes-sir" });
  }
});
