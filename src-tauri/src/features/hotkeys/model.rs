use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum HotkeyAction {
    ToggleOverlayVisibility,
    ToggleOverlayInteractivity,
}

pub const SUPPORTED_HOTKEY_ACTIONS: [HotkeyAction; 2] = [
    HotkeyAction::ToggleOverlayVisibility,
    HotkeyAction::ToggleOverlayInteractivity,
];

#[derive(Clone, Debug, Serialize)]
pub struct HotkeyBinding {
    pub action: HotkeyAction,
    pub accelerator: String,
}

pub fn hotkey_action_key(action: HotkeyAction) -> &'static str {
    match action {
        HotkeyAction::ToggleOverlayVisibility => "toggle_overlay_visibility",
        HotkeyAction::ToggleOverlayInteractivity => "toggle_overlay_interactivity",
    }
}
