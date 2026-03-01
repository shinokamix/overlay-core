import { describe, expect, it } from "vitest";
import { isTauriRuntime } from "@/shared/config/runtime";

describe("runtime", () => {
  it("returns false in test browser environment", () => {
    expect(isTauriRuntime()).toBe(false);
  });
});
