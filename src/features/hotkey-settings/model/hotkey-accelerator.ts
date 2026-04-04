type HotkeyKeyboardEventLike = Pick<
  KeyboardEvent,
  "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey"
>;

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta", "Ctrl"]);

const KEY_ALIASES: Record<string, string> = {
  " ": "Space",
  Spacebar: "Space",
  Esc: "Escape",
  Return: "Enter",
  Control: "Ctrl",
  OS: "Meta",
};

function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}

function normalizeHotkeyKey(key: string): string | null {
  if (!key) {
    return null;
  }

  const alias = KEY_ALIASES[key];
  if (alias) {
    return alias;
  }

  if (key === "Unidentified") {
    return null;
  }

  if (/^F\d{1,2}$/i.test(key)) {
    return key.toUpperCase();
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  if (/^Arrow(Up|Down|Left|Right)$/.test(key)) {
    return key;
  }

  if (
    ["Enter", "Tab", "Backspace", "Delete", "Insert", "Home", "End", "PageUp", "PageDown"].includes(
      key,
    )
  ) {
    return key;
  }

  return null;
}

export function toHotkeyAccelerator(event: HotkeyKeyboardEventLike): string | null {
  const normalizedKey = normalizeHotkeyKey(event.key);
  if (!normalizedKey) {
    return null;
  }

  if (isModifierKey(normalizedKey)) {
    return null;
  }

  const ctrlActive = event.ctrlKey;
  const altActive = event.altKey;
  const shiftActive = event.shiftKey;
  const metaActive = event.metaKey;

  const modifiers: string[] = [];
  if (ctrlActive) {
    modifiers.push("Ctrl");
  }
  if (altActive) {
    modifiers.push("Alt");
  }
  if (shiftActive) {
    modifiers.push("Shift");
  }
  if (metaActive) {
    modifiers.push("Meta");
  }

  if (modifiers.length === 0) {
    return normalizedKey;
  }

  return [...modifiers, normalizedKey].join("+");
}
