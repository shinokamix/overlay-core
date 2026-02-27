import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/shared/lib/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes info logs", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logger.info("test-message", { source: "unit" });

    expect(spy).toHaveBeenCalledWith({
      message: "test-message",
      source: "unit",
    });
  });
});
