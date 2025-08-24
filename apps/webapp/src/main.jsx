import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });

// workspace sanity check
import { placeholder } from "@mindease/ui";
console.log("UI link:", placeholder); // expect: ui-ready

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
