/* eslint-disable @typescript-eslint/no-require-imports */
const { sources, Compilation } = require("webpack");
const { getManifest } = require("../manifest.config.js");

// Emits manifest.json into the webpack output dir, generated per target browser.
class EmitManifestPlugin {
  /** @param {"chrome" | "firefox"} browser */
  constructor(browser) {
    this.browser = browser;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap("EmitManifestPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "EmitManifestPlugin",
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const json = JSON.stringify(getManifest(this.browser), null, 2);
          compilation.emitAsset("manifest.json", new sources.RawSource(json));
        },
      );
    });
  }
}

module.exports = EmitManifestPlugin;
