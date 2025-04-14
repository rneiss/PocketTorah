/// <reference lib="dom" />

import { AppRegistry } from "react-native";
import App from "../src/App";
import { name as appName } from "../app.json";

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById("app"),
});

if ("serviceWorker" in window.navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(__webpack_public_path__ + "/service-worker.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
