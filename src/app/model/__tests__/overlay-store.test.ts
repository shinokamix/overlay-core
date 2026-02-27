import { beforeEach, describe, expect, it } from "vitest";
import { useOverlayStore } from "@/app/model/overlay-store";

describe("overlay-store", () => {
  beforeEach(() => {
    useOverlayStore.setState({ isVisible: true });
  });

  it("toggles visibility", () => {
    expect(useOverlayStore.getState().isVisible).toBe(true);

    useOverlayStore.getState().toggleVisibility();
    expect(useOverlayStore.getState().isVisible).toBe(false);

    useOverlayStore.getState().toggleVisibility();
    expect(useOverlayStore.getState().isVisible).toBe(true);
  });
});
