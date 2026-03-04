use std::{collections::HashMap, sync::Mutex};

use crate::features::hotkeys::model::{HotkeyAction, HotkeyBinding, SUPPORTED_HOTKEY_ACTIONS};
use crate::shared::constants::{
    DEFAULT_TOGGLE_INTERACTIVITY_SHORTCUT, DEFAULT_TOGGLE_OVERLAY_SHORTCUT,
};

pub struct HotkeyBindingsState {
    bindings: Mutex<HashMap<HotkeyAction, String>>,
}

impl HotkeyBindingsState {
    pub fn with_defaults() -> Self {
        let mut bindings = HashMap::new();
        bindings.insert(
            HotkeyAction::ToggleOverlayVisibility,
            DEFAULT_TOGGLE_OVERLAY_SHORTCUT.to_string(),
        );
        bindings.insert(
            HotkeyAction::ToggleOverlayInteractivity,
            DEFAULT_TOGGLE_INTERACTIVITY_SHORTCUT.to_string(),
        );

        Self {
            bindings: Mutex::new(bindings),
        }
    }

    pub fn list(&self) -> Vec<HotkeyBinding> {
        let bindings = self.bindings.lock().expect("hotkey bindings lock poisoned");

        SUPPORTED_HOTKEY_ACTIONS
            .iter()
            .filter_map(|action| {
                bindings.get(action).map(|accelerator| HotkeyBinding {
                    action: *action,
                    accelerator: accelerator.clone(),
                })
            })
            .collect()
    }

    pub fn get(&self, action: HotkeyAction) -> Option<String> {
        self.bindings
            .lock()
            .expect("hotkey bindings lock poisoned")
            .get(&action)
            .cloned()
    }

    pub fn set(&self, action: HotkeyAction, accelerator: String) {
        self.bindings
            .lock()
            .expect("hotkey bindings lock poisoned")
            .insert(action, accelerator);
    }
}
