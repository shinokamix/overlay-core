use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::features::hotkeys::model::{hotkey_action_key, HotkeyAction, HotkeyBinding};
use crate::features::hotkeys::state::HotkeyBindingsState;
use crate::features::overlay;

fn run_hotkey_action(app: &AppHandle, action: HotkeyAction) -> Result<(), String> {
    match action {
        HotkeyAction::ToggleOverlayVisibility => overlay::service::toggle_overlay_visibility(app),
        HotkeyAction::ToggleOverlayInteractivity => {
            overlay::service::toggle_overlay_interaction_enabled(app).map(|_| ())
        }
    }
}

pub fn validate_hotkey_accelerator(accelerator: &str) -> Result<(), String> {
    accelerator
        .parse::<Shortcut>()
        .map(|_| ())
        .map_err(|error| format!("invalid hotkey accelerator '{accelerator}': {error}"))
}

pub fn register_hotkey(
    app: &AppHandle,
    action: HotkeyAction,
    accelerator: &str,
) -> Result<(), String> {
    let action_key = hotkey_action_key(action);
    let shortcut = accelerator.parse::<Shortcut>().map_err(|error| {
        format!("invalid hotkey accelerator '{accelerator}' for action '{action_key}': {error}")
    })?;

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            if let Err(error) = run_hotkey_action(app, action) {
                eprintln!("failed to execute hotkey action '{action_key}': {error}");
            }
        })
        .map_err(|error| {
            format!("failed to register hotkey '{accelerator}' for action '{action_key}': {error}")
        })
}

pub fn unregister_hotkey(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    app.global_shortcut()
        .unregister(accelerator)
        .map_err(|error| {
            format!("failed to unregister hotkey '{accelerator}' from the app: {error}")
        })
}

pub fn register_hotkey_bindings(app: &AppHandle, bindings: &[HotkeyBinding]) -> Result<(), String> {
    for binding in bindings {
        if binding.accelerator.trim().is_empty() {
            continue;
        }

        register_hotkey(app, binding.action, &binding.accelerator)?;
    }

    Ok(())
}

pub fn register_startup_hotkey_bindings(app: &AppHandle) -> Result<(), String> {
    let hotkey_bindings = app.state::<HotkeyBindingsState>().list();
    register_hotkey_bindings(app, &hotkey_bindings)
}

pub fn update_hotkey_binding(
    app: &AppHandle,
    hotkeys: &HotkeyBindingsState,
    action: HotkeyAction,
    accelerator: String,
) -> Result<(), String> {
    let accelerator = accelerator.trim().to_string();

    let current = hotkeys
        .get(action)
        .ok_or_else(|| format!("unsupported hotkey action '{}'", hotkey_action_key(action)))?;

    if current == accelerator {
        return Ok(());
    }

    if !accelerator.is_empty() {
        validate_hotkey_accelerator(&accelerator)?;
    }

    if !current.is_empty() {
        unregister_hotkey(app, &current)?;
    }

    if accelerator.is_empty() {
        hotkeys.set(action, accelerator);
        return Ok(());
    }

    match register_hotkey(app, action, &accelerator) {
        Ok(()) => {
            hotkeys.set(action, accelerator);
            Ok(())
        }
        Err(error) => {
            if !current.is_empty() {
                if let Err(rollback_error) = register_hotkey(app, action, &current) {
                    eprintln!(
                        "failed to rollback previous hotkey '{current}' for action '{}': {rollback_error}",
                        hotkey_action_key(action),
                    );
                }
            }

            Err(error)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::validate_hotkey_accelerator;

    #[test]
    fn accepts_single_key_shortcuts() {
        assert!(validate_hotkey_accelerator("A").is_ok());
        assert!(validate_hotkey_accelerator("Space").is_ok());
    }

    #[test]
    fn accepts_modifier_based_shortcuts() {
        assert!(validate_hotkey_accelerator("Ctrl+Shift+K").is_ok());
    }

    #[test]
    fn rejects_modifier_only_shortcuts() {
        assert!(validate_hotkey_accelerator("Ctrl").is_err());
        assert!(validate_hotkey_accelerator("Ctrl+Shift").is_err());
    }
}
