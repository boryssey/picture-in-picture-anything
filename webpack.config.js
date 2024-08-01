/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const TerserPlugin = require("terser-webpack-plugin");

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
  },
  output: {
    path: path.join(__dirname, "./dist"),
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
    ...(process.env.ANALYZE === "true" ? [new BundleAnalyzerPlugin()] : []),
    new CleanWebpackPlugin({
      verbose: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "./manifest.json",
          to: path.join(__dirname, "dist"),
        },
      ],
    }),
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
