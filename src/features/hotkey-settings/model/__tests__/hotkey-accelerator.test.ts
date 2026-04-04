import { describe, expect, it } from "vitest";
import { toHotkeyAccelerator } from "../hotkey-accelerator";

describe("toHotkeyAccelerator", () => {
  it("builds accelerator for letter key combinations", () => {
    expect(
      toHotkeyAccelerator({
        key: "k",
        ctrlKey: true,
        altKey: false,
        shiftKey: true,
        metaKey: false,
      }),
    ).toBe("Ctrl+Shift+K");
  });

  it("maps space key into accelerator syntax", () => {
    expect(
      toHotkeyAccelerator({
        key: " ",
        ctrlKey: true,
        altKey: false,
        shiftKey: true,
        metaKey: false,
      }),
    ).toBe("Ctrl+Shift+Space");
  });

  it("supports single-key shortcuts", () => {
    expect(
      toHotkeyAccelerator({
        key: "A",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      }),
    ).toBe("A");
  });

  it("ignores modifier-only shortcuts", () => {
    expect(
      toHotkeyAccelerator({
        key: "Control",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      }),
    ).toBeNull();
  });
});
