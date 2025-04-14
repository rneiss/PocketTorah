import CopyPlugin from "copy-webpack-plugin";
import HtmlBundlerPlugin from "html-bundler-webpack-plugin";
import * as path from "path";
import webpack from "webpack";
import type {} from "webpack-dev-server";
import { GenerateSW } from "workbox-webpack-plugin";
import type { Env } from "./webpack.config";
import {
  appDirectory,
  babelLoaderConfigurations,
  babelRuntimeAlias,
  imageLoaderConfigurations,
} from "./webpack.config.common.mjs";

const platform = "web";

const publicPath = process.env.WEBPACK_PUBLIC_PATH || "/PocketTorah/";

export default (env: Env): webpack.Configuration => ({
  context: appDirectory,
  // configures where the build ends up
  output: {
    path: path.resolve(appDirectory, "dist"),
    publicPath,
    clean: {
      keep: /(\.nojekyll|\.git)$/,
    },
  },
  mode: env.mode,
  target: "web",

  // ...the rest of your config
  module: {
    rules: [
      {
        test: /\.webmanifest$/i,
        use: "webpack-webmanifest-loader",
        type: "asset/resource",
      },
      ...babelLoaderConfigurations(),
      ...imageLoaderConfigurations({ platform, publicPath }),
    ],
  },

  resolve: {
    // This will only alias the exact import "react-native"
    alias: {
      "react-native$": "react-native-web",
      "@react-native/assets-registry/registry": "react-native-web/dist/modules/AssetRegistry",
      ...babelRuntimeAlias,
    },
    conditionNames: ["require", "import", "web"],
    exportsFields: ["exports"],
    // If you're working on a multi-platform React Native app, web-specific
    // module implementations should be written in files using the extension
    // `.web.js`.
    extensions: [".web.js", ".js", ".web.ts", ".ts", ".web.tsx", ".tsx", ".web.jsx", ".jsx"],
    fallback: { crypto: false },
  },
  plugins: [
    new webpack.EnvironmentPlugin({ REACT_NAV_LOGGING: "" }),
    new webpack.DefinePlugin({ __DEV__: env.mode !== "production" }),
    new CopyPlugin({
      patterns: [
        {
          from: "data/",
          to: "data/",
          filter: (path) => /\.(json|mp3)$/.test(path),
        },
      ],
    }),
    new HtmlBundlerPlugin({
      entry: { index: "web/index.html" },
      loaderOptions: {
        sources: [
          {
            tag: "link",
            attributes: ["href"],
            filter: ({ attributes }) => (attributes as any).rel === "manifest",
          },
        ],
      },
    }),
    new GenerateSW({
      exclude: [/\.mp3$/, /\.map$/, /^manifest.*\.js$/],
      // include: [/data\/trope\/audio\/.*\.mp3$/],
      runtimeCaching: [
        {
          urlPattern: /\.mp3$/,
          handler: "CacheFirst",
        },
      ],
    }),
  ],

  devServer: {
    port: 8080,
    static: { directory: "data", publicPath: publicPath + "data", watch: false },
    client: {
      overlay: {
        errors: true,
        runtimeErrors: true,
        warnings: false,
      },
    },
    onListening: (devServer) => {
      const { port } = devServer.server!.address() as import("node:net").AddressInfo;
      console.log(`PocketTorah at http://localhost:${port}${publicPath}`);
    },
  },
});
