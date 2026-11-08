import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Providers } from "./app/providers";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/error-boundary";
import { ErrorPage } from "./pages/error-page";
import "./lib/i18n";
import "./index.css";
import "./styles/legacy-base.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<ErrorPage code={500} reloadDocument onRetry={() => window.location.reload()} />}>
      <Providers><App /><Toaster /></Providers>
    </ErrorBoundary>
  </React.StrictMode>,
);