import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Import from workspace package
import { testMessage } from "@mindease/ui";

console.log(testMessage); // should print in browser console

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
