# Build instructions for reviewers (AMO source-code submission)

The submitted Firefox package is generated from TypeScript with webpack, so this source is
provided per Mozilla's [source code submission policy](https://extensionworkshop.com/documentation/publish/source-code-submission/).
Following these steps reproduces the exact files contained in the submitted add-on.

## Environment

All build tools are open source, run locally, and are cross-platform.

- Operating system: any recent Linux, macOS, or Windows (the reviewer default, Ubuntu 24.04, should work).
- Node.js 22.15.0 or newer (the reviewer default Node 24.x is fine).
- pnpm — the exact version is pinned in `package.json` via the `packageManager` field. Get it with Corepack (bundled with Node): run `corepack enable`, then pnpm uses the pinned version automatically in this directory.

Install with pnpm only. The dependency tree is locked in `pnpm-lock.yaml`; using npm or yarn may resolve different versions and change the output.

## Steps to reproduce

From the root of this source archive:

1. `pnpm install --frozen-lockfile`
2. `pnpm run build:firefox`

## What maps to the submission

Step 2 writes the unpacked extension to `dist/firefox/`. Those files are exactly the files in the
submitted add-on package. The build is not minified (`minimize: false` in `webpack.config.js`), so the
emitted JavaScript is human-readable and deterministic.

(`pnpm run package:firefox` additionally zips `dist/firefox/` into `web-ext-artifacts/` — that zip is
what was uploaded to AMO.)
