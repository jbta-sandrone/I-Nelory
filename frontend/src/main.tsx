import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  AppearanceProvider,
  initializeAppearance,
} from "./context/AppearanceContext";
import "./index.css";

initializeAppearance();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  </React.StrictMode>
);
