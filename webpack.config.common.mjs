import * as Repack from "@callstack/repack";
import { createRequire } from "node:module";
import path from "node:path";
import webpack from "webpack";

export const appDirectory = Repack.getDirname(import.meta.url);

export const babelRuntimeAlias = {
  "@babel/runtime/helpers": path.join(appDirectory, "node_modules/@babel/runtime/helpers"),
};

/**
 * @param {webpack.RuleSetRule} test
 * @param {webpack.RuleSetCondition} issuer
 * @param {webpack.RuleSetRule} then
 * @param {webpack.RuleSetRule} else_
 * @returns {webpack.RuleSetRule[]}
 */
const ifIssuerElse = (cond, issuer, then, else_) => [
  { ...then, ...cond, issuer },
  { ...else_, ...cond, issuer: { not: issuer } },
];

// This is needed for webpack to import static images in JavaScript files.
/** @return {webpack.RuleSetRule[]} */
export const imageLoaderConfigurations = (opts) => [
  ...ifIssuerElse(
    {
      test: Repack.getAssetExtensionsRegExp([
        ...Repack.ASSET_EXTENSIONS.filter((ext) => ext !== "svg" && ext !== "html"),
        "woff2",
      ]),
    },
    /\.[jt]sx?$/,
    {
      use: {
        loader: "@callstack/repack/assets-loader",
        options: { scalableAssetExtensions: Repack.SCALABLE_ASSETS, ...opts },
      },
    },
    { type: "asset/resource" },
  ),
  /\.[jt]sx?$/,
  {
    resourceFragment: /res/,
    type: "javascript/auto",
    use: {
      loader: "@callstack/repack/assets-loader",
      options: { scalableAssetExtensions: Repack.SCALABLE_ASSETS, ...opts },
    },
  },
  {
    test: /\.svg$/,
    use: {
      loader: "@svgr/webpack",
      options: { native: true },
    },
  },
];

/** @return {webpack.RuleSetRule[]} */
export const babelLoaderConfigurations = ({ devServer } = {}) => [
  {
    test: /\.c?[jt]sx?$/,
    include: [
      /node_modules(.*[/\\])+react-native/,
      /node_modules(.*[/\\])+@react-native/,
      /node_modules(.*[/\\])+@react-navigation/,
      /node_modules(.*[/\\])+@react-native-community/,
      /node_modules(.*[/\\])+expo/,
      /node_modules(.*[/\\])+pretty-format/,
      /node_modules(.*[/\\])+metro/,
      /node_modules(.*[/\\])+abort-controller/,
      /node_modules(.*[/\\])+@callstack[/\\]repack/,
      /node_modules(.*[/\\])+react-native-calendars/,
      /node_modules(.*[/\\])+@react-native-async-storage/,
      /node_modules(.*[/\\])+react-freeze/,
    ],
    loader: "babel-loader",
    options: {
      cacheDirectory: true,
    },
  },
  {
    test: /\.m[jt]sx?$/,
    include: [/node_modules/],
    loader: "babel-loader",
    options: {
      cacheDirectory: true,
      presets: [["module:@react-native/babel-preset", { disableImportExportTransform: true }]],
      comments: true,
    },
  },
  {
    test: /\.[jt]sx?$/,
    exclude: /node_modules/,
    use: {
      loader: "babel-loader",
      options: {
        /** Add React Refresh transform only when HMR is enabled. */
        plugins: devServer && devServer.hmr ? ["module:react-refresh/babel"] : undefined,
        cacheDirectory: true,
      },
    },
  },
  {
    test: /\.json/,
    resourceQuery: /res/,
    type: "asset/resource",
  },
];
