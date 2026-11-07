import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Providers } from "./app/providers";
import { Toaster } from "./components/ui/toaster";
import "./index.css";
import "./styles/legacy-base.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers><App /><Toaster /></Providers>
  </React.StrictMode>,
);