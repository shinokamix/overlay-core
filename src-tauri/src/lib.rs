#[cfg(desktop)]
use serde::{Deserialize, Serialize};
#[cfg(desktop)]
use std::{collections::HashMap, sync::Mutex};
#[cfg(desktop)]
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
#[cfg(desktop)]
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

#[cfg(desktop)]
const MAIN_WINDOW_LABEL: &str = "main";
#[cfg(desktop)]
const DEFAULT_TOGGLE_OVERLAY_SHORTCUT: &str = "Ctrl+Shift+Space";
#[cfg(desktop)]
const DEFAULT_TOGGLE_INTERACTIVITY_SHORTCUT: &str = "Ctrl+Shift+Enter";
#[cfg(desktop)]
const TOGGLE_OVERLAY_CLI_ARG: &str = "--toggle-overlay";
#[cfg(desktop)]
const OVERLAY_INTERACTION_CHANGED_EVENT: &str = "overlay://interaction-changed";

#[cfg(desktop)]
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
enum HotkeyAction {
    ToggleOverlayVisibility,
    ToggleOverlayInteractivity,
}

#[cfg(desktop)]
const SUPPORTED_HOTKEY_ACTIONS: [HotkeyAction; 2] = [
    HotkeyAction::ToggleOverlayVisibility,
    HotkeyAction::ToggleOverlayInteractivity,
];

#[cfg(desktop)]
#[derive(Clone, Debug, Serialize)]
struct HotkeyBinding {
    action: HotkeyAction,
    accelerator: String,
}

#[cfg(desktop)]
struct HotkeyBindingsState {
    bindings: Mutex<HashMap<HotkeyAction, String>>,
}

#[cfg(desktop)]
struct OverlayRuntimeState {
    interaction_enabled: Mutex<bool>,
}

#[cfg(desktop)]
impl HotkeyBindingsState {
    fn with_defaults() -> Self {
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

    fn list(&self) -> Vec<HotkeyBinding> {
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

    fn get(&self, action: HotkeyAction) -> Option<String> {
        self.bindings
            .lock()
            .expect("hotkey bindings lock poisoned")
            .get(&action)
            .cloned()
    }

    fn set(&self, action: HotkeyAction, accelerator: String) {
        self.bindings
            .lock()
            .expect("hotkey bindings lock poisoned")
            .insert(action, accelerator);
    }
}

#[cfg(desktop)]
impl OverlayRuntimeState {
    fn with_defaults() -> Self {
        Self {
            interaction_enabled: Mutex::new(false),
        }
    }

    fn get(&self) -> bool {
        *self
            .interaction_enabled
            .lock()
            .expect("overlay runtime lock poisoned")
    }

    fn set(&self, enabled: bool) {
        *self
            .interaction_enabled
            .lock()
            .expect("overlay runtime lock poisoned") = enabled;
    }
}

#[cfg(desktop)]
fn hotkey_action_key(action: HotkeyAction) -> &'static str {
    match action {
        HotkeyAction::ToggleOverlayVisibility => "toggle_overlay_visibility",
        HotkeyAction::ToggleOverlayInteractivity => "toggle_overlay_interactivity",
    }
}

#[cfg(desktop)]
fn args_request_overlay_toggle(args: &[String]) -> bool {
    args.iter().any(|arg| arg == TOGGLE_OVERLAY_CLI_ARG)
}

#[cfg(desktop)]
fn handle_overlay_toggle_request(app: &AppHandle, source: &str) {
    if let Err(error) = toggle_overlay_visibility(app) {
        eprintln!("failed to toggle overlay visibility from {source}: {error}");
    }
}

#[cfg(desktop)]
fn apply_overlay_flag(flag: &str, result: tauri::Result<()>) {
    if let Err(error) = result {
        eprintln!("failed to apply overlay window flag '{flag}': {error}");
    }
}

#[cfg(desktop)]
fn configure_overlay_window(window: &WebviewWindow) {
    apply_overlay_flag("decorations", window.set_decorations(false));
    apply_overlay_flag("resizable", window.set_resizable(false));
    apply_overlay_flag("minimizable", window.set_minimizable(false));
    apply_overlay_flag("shadow", window.set_shadow(false));
    apply_overlay_flag("always_on_top", window.set_always_on_top(true));
    apply_overlay_flag("content_protected", window.set_content_protected(true));
    apply_overlay_flag("skip_taskbar", window.set_skip_taskbar(true));
    apply_overlay_flag(
        "visible_on_all_workspaces",
        window.set_visible_on_all_workspaces(true),
    );
}

#[cfg(desktop)]
fn emit_overlay_interaction_changed(app: &AppHandle, enabled: bool) {
    if let Err(error) = app.emit(OVERLAY_INTERACTION_CHANGED_EVENT, enabled) {
        eprintln!("failed to emit overlay interaction event: {error}");
    }
}

#[cfg(desktop)]
fn set_overlay_interaction_enabled(app: &AppHandle, enabled: bool) -> Result<bool, String> {
    let overlay_state = app.state::<OverlayRuntimeState>();
    overlay_state.set(enabled);

    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        window
            .set_ignore_cursor_events(!enabled)
            .map_err(|error| format!("failed to set overlay cursor behavior: {error}"))?;
    }

    emit_overlay_interaction_changed(app, enabled);

    Ok(enabled)
}

#[cfg(desktop)]
fn toggle_overlay_interaction_enabled(app: &AppHandle) -> Result<bool, String> {
    let next = !app.state::<OverlayRuntimeState>().get();
    set_overlay_interaction_enabled(app, next)
}

#[cfg(desktop)]
fn toggle_overlay_visibility(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| format!("window '{MAIN_WINDOW_LABEL}' is not available"))?;

    let is_visible = window
        .is_visible()
        .map_err(|error| format!("failed to read overlay visibility: {error}"))?;

    if is_visible {
        if let Err(error) = set_overlay_interaction_enabled(app, false) {
            eprintln!("failed to lock overlay interaction before hide: {error}");
        }

        window
            .hide()
            .map_err(|error| format!("failed to hide overlay window: {error}"))?;
    } else {
        window
            .show()
            .map_err(|error| format!("failed to show overlay window: {error}"))?;

        configure_overlay_window(&window);

        let interaction_enabled = app.state::<OverlayRuntimeState>().get();
        window
            .set_ignore_cursor_events(!interaction_enabled)
            .map_err(|error| format!("failed to apply overlay cursor behavior: {error}"))?;
    }

    Ok(())
}

#[cfg(desktop)]
fn run_hotkey_action(app: &AppHandle, action: HotkeyAction) -> Result<(), String> {
    match action {
        HotkeyAction::ToggleOverlayVisibility => toggle_overlay_visibility(app),
        HotkeyAction::ToggleOverlayInteractivity => {
            toggle_overlay_interaction_enabled(app).map(|_| ())
        }
    }
}

#[cfg(desktop)]
#[tauri::command]
fn get_overlay_interaction_enabled(runtime_state: tauri::State<'_, OverlayRuntimeState>) -> bool {
    runtime_state.get()
}

#[cfg(desktop)]
#[tauri::command]
fn set_overlay_interaction_enabled_command(app: AppHandle, enabled: bool) -> Result<bool, String> {
    set_overlay_interaction_enabled(&app, enabled)
}

#[cfg(desktop)]
#[tauri::command]
fn toggle_overlay_interaction_enabled_command(app: AppHandle) -> Result<bool, String> {
    toggle_overlay_interaction_enabled(&app)
}

#[cfg(desktop)]
fn validate_hotkey_accelerator(accelerator: &str) -> Result<(), String> {
    accelerator
        .parse::<Shortcut>()
        .map(|_| ())
        .map_err(|error| format!("invalid hotkey accelerator '{accelerator}': {error}"))
}

#[cfg(desktop)]
fn register_hotkey(app: &AppHandle, action: HotkeyAction, accelerator: &str) -> Result<(), String> {
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

#[cfg(desktop)]
fn unregister_hotkey(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    app.global_shortcut()
        .unregister(accelerator)
        .map_err(|error| {
            format!("failed to unregister hotkey '{accelerator}' from the app: {error}")
        })
}

#[cfg(desktop)]
fn register_hotkey_bindings(app: &AppHandle, bindings: &[HotkeyBinding]) -> Result<(), String> {
    for binding in bindings {
        register_hotkey(app, binding.action, &binding.accelerator)?;
    }

    Ok(())
}

#[cfg(desktop)]
#[tauri::command]
fn get_hotkey_bindings(hotkeys: tauri::State<'_, HotkeyBindingsState>) -> Vec<HotkeyBinding> {
    hotkeys.list()
}

#[cfg(desktop)]
#[tauri::command]
fn update_hotkey_binding(
    app: AppHandle,
    hotkeys: tauri::State<'_, HotkeyBindingsState>,
    action: HotkeyAction,
    accelerator: String,
) -> Result<(), String> {
    let accelerator = accelerator.trim().to_string();
    if accelerator.is_empty() {
        return Err("hotkey accelerator cannot be empty".to_string());
    }

    validate_hotkey_accelerator(&accelerator)?;

    let current = hotkeys
        .get(action)
        .ok_or_else(|| format!("unsupported hotkey action '{}'", hotkey_action_key(action)))?;

    if current == accelerator {
        return Ok(());
    }

    unregister_hotkey(&app, &current)?;

    match register_hotkey(&app, action, &accelerator) {
        Ok(()) => {
            hotkeys.set(action, accelerator);
            Ok(())
        }
        Err(error) => {
            if let Err(rollback_error) = register_hotkey(&app, action, &current) {
                eprintln!(
                    "failed to rollback previous hotkey '{current}' for action '{}': {rollback_error}",
                    hotkey_action_key(action),
                );
            }

            Err(error)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if args_request_overlay_toggle(&argv) {
                handle_overlay_toggle_request(app, "single-instance callback");
            }
        }))
        .invoke_handler(tauri::generate_handler![
            get_hotkey_bindings,
            update_hotkey_binding,
            get_overlay_interaction_enabled,
            set_overlay_interaction_enabled_command,
            toggle_overlay_interaction_enabled_command
        ]);

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.manage(HotkeyBindingsState::with_defaults());
                app.manage(OverlayRuntimeState::with_defaults());

                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle()
                    .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

                let hotkey_bindings = app.state::<HotkeyBindingsState>().list();
                if let Err(error) = register_hotkey_bindings(app.handle(), &hotkey_bindings) {
                    eprintln!("failed to register startup hotkeys: {error}");
                }

                if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
                    configure_overlay_window(&window);
                    apply_overlay_flag(
                        "ignore_cursor_events",
                        window.set_ignore_cursor_events(true),
                    );
                } else {
                    eprintln!("main window not found: overlay flags were not applied");
                }

                let startup_args = std::env::args().collect::<Vec<_>>();
                if args_request_overlay_toggle(&startup_args) {
                    handle_overlay_toggle_request(app.handle(), "startup argument");
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
