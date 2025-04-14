// this is the native entrypoint - web is in web/index.ts

import "intl-pluralrules";

import { Script, ScriptManager } from "@callstack/repack/client";
import { AppRegistry } from "react-native";
import { name as appName } from "./app.json";
import App from "./src/App";

AppRegistry.registerComponent(appName, () => App);

ScriptManager.shared.addResolver(async (scriptId) => {
  // In development, get all the chunks from dev server.
  if (__DEV__) {
    return {
      url: Script.getDevServerURL(scriptId),
      cache: false,
    };
  }

  return {
    url: Script.getFileSystemURL(scriptId),
  };
});
