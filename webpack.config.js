/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const TerserPlugin = require("terser-webpack-plugin");
const EmitManifestPlugin = require("./scripts/emitManifestPlugin.js");

const targetBrowser = process.env.BROWSER === "firefox" ? "firefox" : "chrome";

const alias = {
  "@src": path.resolve(__dirname, "src"),
};

if (process.env.NODE_ENV !== "development") {
  process.env.NODE_ENV = "production";
}

const options = {
  mode: process.env.NODE_ENV,
  devServer: {
    hot: false,
  },
  entry: {
    background: path.resolve(__dirname, "src", "Background", "index.ts"),
    content: path.resolve(__dirname, "src", "ContentScripts", "index.ts"),
    ...(targetBrowser === "firefox"
      ? {
          "pip-main": path.resolve(
            __dirname,
            "src",
            "ContentScripts",
            "pip-main.ts",
          ),
        }
      : {}),
  },
  output: {
    path: path.join(__dirname, "dist", targetBrowser),
    clean: true,
    filename: "[name].js",
  },
  resolve: {
    alias,
    extensions: ["", ".js", ".ts"],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: "style-loader",
            options: {
              injectType: "lazyStyleTag",
              insert: require.resolve("./insertStyle.js"),
            },
          },
          {
            loader: "css-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __BROWSER__: JSON.stringify(targetBrowser),
    }),
    ...(process.env.ANALYZE === "true" ? [new BundleAnalyzerPlugin()] : []),
    new CleanWebpackPlugin({
      verbose: false,
    }),
    new EmitManifestPlugin(targetBrowser),
    new CopyPlugin({
      patterns: [
        {
          from: ".",
          to: ".",
          context: "public",
        },
      ],
    }),
  ],
  infrastructureLogging: {
    level: "verbose",
  },
};

if (process.env.NODE_ENV === "development") {
  options.devtool = "cheap-module-source-map";
} else {
  options.optimization = {
    usedExports: true,
    minimize: true,
    minimizer: [new TerserPlugin()],
  };
}

module.exports = options;
