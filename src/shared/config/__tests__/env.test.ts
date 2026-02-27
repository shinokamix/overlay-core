import { describe, expect, it } from "vitest";
import { parseEnv } from "@/shared/config/env";

describe("parseEnv", () => {
  it("parses valid values", () => {
    const value = parseEnv({
      VITE_APP_ENV: "staging",
      VITE_ENABLE_CRASH_REPORTS: "true",
    });

    expect(value).toEqual({
      appEnv: "staging",
      enableCrashReports: true,
    });
  });

  it("uses defaults", () => {
    const value = parseEnv({});

    expect(value).toEqual({
      appEnv: "development",
      enableCrashReports: false,
    });
  });

  it("throws on invalid values", () => {
    expect(() =>
      parseEnv({
        VITE_APP_ENV: "qa",
      }),
    ).toThrow("Invalid environment configuration");
  });
});
