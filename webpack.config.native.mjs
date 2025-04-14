// webpack config file for native targets

import * as Repack from "@callstack/repack";
import { createRequire } from "node:module";
import * as path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import {
  babelLoaderConfigurations,
  imageLoaderConfigurations,
  appDirectory,
  babelRuntimeAlias,
} from "./webpack.config.common.mjs";

const { resolve } = createRequire(import.meta.url);

/**
 * Webpack configuration.
 * You can also export a static object or a function returning a Promise.
 *
 * @param env Environment options passed from either Webpack CLI or React Native Community CLI
 *            when running with `react-native start/bundle`.
 * @returns {webpack.Configuration}
 */
export default (env) => {
  const {
    mode = "development",
    context = appDirectory,
    entry = "./index.ts",
    platform = process.env.PLATFORM,
    minimize = mode === "production",
    devServer = undefined,
    bundleFilename = undefined,
    sourceMapFilename = undefined,
    assetsPath = undefined,
    reactNativePath = resolve("react-native"),
  } = env;

  if (!platform) {
    throw new Error("Missing platform");
  }

  return {
    mode,
    devtool: false,
    context,
    entry: [
      ...Repack.getInitializationEntries(reactNativePath, {
        hmr: devServer && devServer.hmr,
      }),
      "./index.ts",
    ],
    resolve: {
      ...Repack.getResolveOptions(platform),
      conditionNames: ["require", "import", "react-native"],
      exportsFields: ["exports"],
      alias: babelRuntimeAlias,
    },

    // configures where the build ends up
    output: {
      clean: true,
      hashFunction: "xxhash64",
      path: path.join(appDirectory, "build/generated", platform),
      filename: "index.bundle",
      chunkFilename: "[name].chunk.bundle",
      publicPath: Repack.getPublicPath({ platform, devServer }),
    },

    optimization: {
      /** Enables minification based on values passed from React Native CLI or from fallback. */
      minimize,
      /** Configure minimizer to process the bundle. */
      minimizer: [
        new TerserPlugin({
          test: /\.(js)?bundle(\?.*)?$/i,
          /**
           * Prevents emitting text file with comments, licenses etc.
           * If you want to gather in-file licenses, feel free to remove this line or configure it
           * differently.
           */
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
          },
        }),
      ],
      chunkIds: "named",
    },

    // ...the rest of your config
    module: {
      rules: [
        ...babelLoaderConfigurations({ devServer }),
        ...imageLoaderConfigurations({ platform, devServerEnabled: Boolean(devServer) }),
      ],
    },

    plugins: [
      new webpack.EnvironmentPlugin({ REACT_NAV_LOGGING: "" }),
      new Repack.RepackPlugin({
        context,
        mode,
        platform,
        devServer,
        output: {
          bundleFilename,
          sourceMapFilename,
          assetsPath,
        },
      }),
    ],
  };
};
