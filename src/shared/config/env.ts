import { z } from "zod";

const envSchema = z.object({
  VITE_APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  VITE_ENABLE_CRASH_REPORTS: z.enum(["true", "false"]).default("false"),
});

type RawEnv = Record<string, unknown>;

export function parseEnv(rawEnv: RawEnv) {
  const parsedEnv = envSchema.safeParse(rawEnv);

  if (!parsedEnv.success) {
    const issues = parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return {
    appEnv: parsedEnv.data.VITE_APP_ENV,
    enableCrashReports: parsedEnv.data.VITE_ENABLE_CRASH_REPORTS === "true",
  } as const;
}

export const env = parseEnv(import.meta.env);
