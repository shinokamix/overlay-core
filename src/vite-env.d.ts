/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: "development" | "staging" | "production";
  readonly VITE_ENABLE_CRASH_REPORTS?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
