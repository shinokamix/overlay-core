import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles.css";
import { ErrorBoundary } from "@/app/providers/error-boundary";
import { env } from "@/shared/config/env";
import { logger } from "@/shared/lib/logger";
import { queryClient } from "@/shared/lib/query-client";

document.documentElement.dataset.appEnv = env.appEnv;
logger.info("App bootstrap", { env: env.appEnv });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
