// Generates the Manifest V3 object per target browser.
// Consumed by scripts/emitManifestPlugin.js during the webpack build.

/** @typedef {"chrome" | "firefox"} TargetBrowser */

const NAME =
  "Picture-in-Picture Anything - Place Any Element on Top of your screen";
const VERSION = "1.1.0";
const DESCRIPTION =
  "Native Picture-in-Picture mode for anything, not just videos.";

/**
 * @param {string} defaultKey Windows/Linux shortcut for the run-pip command.
 */
const runPipCommand = (defaultKey) => ({
  "run-pip": {
    suggested_key: { default: defaultKey, mac: "MacCtrl+Shift+P" },
    description: "Run Picture-in-Picture Anything on current page",
  },
});

/**
 * Build the extension manifest for the given target browser.
 * @param {TargetBrowser} browser
 */
const getManifest = (browser) => {
  const base = {
    manifest_version: 3,
    name: NAME,
    version: VERSION,
    description: DESCRIPTION,
    permissions: ["storage", "activeTab", "scripting", "contextMenus"],
    action: { default_title: "Picture-in-Picture Anything" },
    icons: {
      16: "icons/16.png",
      32: "icons/32.png",
      48: "icons/48.png",
      128: "icons/128.png",
    },
    web_accessible_resources: [
      { resources: ["fonts/Inter.ttf"], matches: ["<all_urls>"] },
    ],
  };

  if (browser === "firefox") {
    return {
      ...base,
      // Firefox/AMO caps "name" at 45 chars; Chrome keeps the longer listing name.
      name: "Picture-in-Picture Anything",
      background: { scripts: ["background.js"] },
      commands: runPipCommand("Alt+Shift+P"),
      browser_specific_settings: {
        gecko: {
          id: "{ad303b4f-b8e4-4365-ad5f-17569e3d4759}",
          strict_min_version: "151.0",
          // Extension collects no user data.
          data_collection_permissions: { required: ["none"] },
        },
      },
    };
  }

  // chrome (default)
  return {
    ...base,
    background: { service_worker: "background.js" },
    commands: runPipCommand("Ctrl+Shift+P"),
  };
};

module.exports = { getManifest };
