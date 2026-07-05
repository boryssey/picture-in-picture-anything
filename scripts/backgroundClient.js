import browser from "webextension-polyfill";

const logger = (msg) => {
  console.log(`[BGC] ${msg}`);
};

logger("background client up.");

logger("connecting to SSE service...");
// eslint-disable-next-line no-undef
const port = new URLSearchParams(__resourceQuery).get("port");
const es = new EventSource(`http://localhost:${port}/__server_sent_events__`);

es.addEventListener(
  "open",
  () => {
    logger("SSE service connected!");
  },
  false,
);

es.addEventListener(
  "error",
  (event) => {
    if (event.target.readyState === 0) {
      console.error("[BGC] you need to open devServer first!");
    } else {
      console.error(event);
    }
  },
  false,
);

es.addEventListener("background-updated", () => {
  logger("received 'background-updated' event from SSE service.");
  logger("extension will reload to reload background...");
  // setTimeout(() => {

  browser.runtime.reload();
  // }, 5000);
  // reload extension to reload background.
});

es.addEventListener(
  "content-scripts-updated",
  () => {
    logger("received 'content-scripts-updated' event from SSE service.");
    browser.tabs
      .query({})
      .then((tabs) => {
        tabs.forEach((tab) => {
          browser.tabs
            .sendMessage(tab.id, {
              from: "backgroundClient",
              action: "reload-yourself",
            })
            .then((res) => {
              if (!res) return;

              const { from, action } = res;
              if (from === "contentScriptClient" && action === "yes-sir") {
                es.close();
                logger("extension will reload to update content scripts...");
                browser.runtime.reload();
              }
            })
            .catch(() => {
              // tab has no content-script listener — ignore (was the runtime.lastError guard)
            });
        });
      })
      .catch(() => {
        // ignore tabs.query errors
      });
  },
  false,
);
