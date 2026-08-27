import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/lora/cyrillic-400.css";
import "@fontsource/lora/cyrillic-500.css";
import "@fontsource/lora/cyrillic-600.css";
import "@fontsource/lora/latin-400.css";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/latin-600.css";
import "@fontsource/lora/latin-ext-400.css";
import "@fontsource/lora/latin-ext-500.css";
import "@fontsource/lora/latin-ext-600.css";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Calea could not find its application root.");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
