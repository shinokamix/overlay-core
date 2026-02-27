import { env } from "@/shared/config/env";

type LogMeta = Record<string, unknown>;

function log(method: "debug" | "info" | "warn" | "error", message: string, meta?: LogMeta) {
  if (method === "debug" && env.appEnv === "production") {
    return;
  }

  const payload = meta ? { message, ...meta } : message;
  console[method](payload);
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => log("debug", message, meta),
  info: (message: string, meta?: LogMeta) => log("info", message, meta),
  warn: (message: string, meta?: LogMeta) => log("warn", message, meta),
  error: (message: string, meta?: LogMeta) => log("error", message, meta),
};
