/* eslint-disable @typescript-eslint/no-var-requires */
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";
process.env.ASSET_PATH = "/";
process.env.PORT = "3000";

// import WebpackDevServer from "webpack-dev-server";
// import webpack from "webpack";
// import path from "path";
// import SSEStream from "ssestream";
// import _ from "lodash";
const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const path = require("path");
const SSEStream = require("ssestream").default;
const _ = require("lodash");
const { debounce } = _;

// import config from "../webpack.config.js";
// import { fileURLToPath } from "url";
const config = require("../webpack.config.js");
// const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
// const __dirname = path.dirname(__filename); // get the name of the directory

const notHMR = ["background", "content", "devtools"];

Object.keys(config.entry)
  .filter((entryName) => !notHMR.includes(entryName))
  .forEach((entryName) => {
    config.entry[entryName] = [
      "webpack/hot/dev-server.js",
      `webpack-dev-server/client/index.js?hot=true&hostname=localhost&port=${process.env.PORT}`,
    ].concat(config.entry[entryName]);
  });

config.entry["background"] = [
  path.resolve(__dirname, `./backgroundClient.js?port=${process.env.PORT}`),
].concat(config.entry["background"]);

config.entry["content"] = [
  path.resolve(__dirname, "./contentScriptClient.js"),
].concat(config.entry["content"]);

const compiler = webpack(config);

const server = new WebpackDevServer(
  {
    hot: false,
    liveReload: false,

    client: false,
    compress: false, // if set true, server-sent events will not work!
    host: "localhost",
    port: process.env.PORT,
    static: {
      directory: path.join(__dirname, "../build"),
    },
    devMiddleware: {
      publicPath: `http://localhost:${process.env.PORT}/`,
      writeToDisk: true,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    allowedHosts: "all",
    // the following option really matters!
    setupMiddlewares: (middlewares, devServer) => {
      // if auto-reload is not needed, this middleware is not needed.
      if (!devServer) {
        throw new Error("webpack-dev-server is not defined");
      }

      // imagine you are using app.use(path, middleware) in express.
      // in fact, devServer is an express server.
      middlewares.push({
        path: "/__server_sent_events__", // you can find this path requested by backgroundClient.js.
        middleware: (req, res) => {
          const sseStream = new SSEStream(req);
          sseStream.pipe(res);

          sseStream.write("message from webserver.");

          let closed = false;

          const compileDoneHook = debounce((stats) => {
            const { modules } = stats.toJson({ all: false, modules: true });
            const updatedJsModules = modules.filter(
              (module) =>
                module.type === "module" &&
                module.moduleType === "javascript/auto",
            );
            const isBackgroundUpdated = updatedJsModules.some((module) =>
              module.nameForCondition.startsWith(
                path.resolve(__dirname, "../src/Background"),
              ),
            );

            const isContentScriptsUpdated = updatedJsModules.some((module) =>
              module.nameForCondition.startsWith(
                path.resolve(__dirname, "../src/ContentScripts"),
              ),
            );

            const shouldBackgroundReload =
              !stats.hasErrors() && isBackgroundUpdated;
            const shouldContentScriptsReload =
              !stats.hasErrors() && isContentScriptsUpdated;
            console.log({
              shouldBackgroundReload,
              shouldContentScriptsReload,
            });
            if (shouldBackgroundReload) {
              sseStream.writeMessage(
                {
                  event: "background-updated",
                  data: {}, // "data" key should be reserved though it is empty.
                },
                "utf-8",
              );
            }
            if (shouldContentScriptsReload) {
              sseStream.writeMessage(
                {
                  event: "content-scripts-updated",
                  data: {},
                },
                "utf-8",
              );
            }
          }, 1000);

          const plugin = (stats) => {
            if (!closed) {
              compileDoneHook(stats);
            }
          };

          // a mini webpack plugin just born!
          // this plugin will be triggered after each compilation done.
          compiler.hooks.done.tap("extension-auto-reload-plugin", plugin);

          res.on("close", () => {
            closed = true;
            sseStream.unpipe(res);
          });
        },
      });

      return middlewares;
    },
  },
  compiler,
);

(async () => {
  await server.start();
})();
