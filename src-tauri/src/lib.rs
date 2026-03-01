#[cfg(desktop)]
use serde::{Deserialize, Serialize};
#[cfg(desktop)]
use std::{collections::HashMap, sync::Mutex};
#[cfg(all(desktop, target_os = "linux"))]
use std::{fs, path::PathBuf, process::Command, thread, time::Duration};
#[cfg(desktop)]
use tauri::{AppHandle, Manager, WebviewWindow};
#[cfg(desktop)]
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[cfg(desktop)]
const MAIN_WINDOW_LABEL: &str = "main";
#[cfg(desktop)]
const DEFAULT_TOGGLE_OVERLAY_SHORTCUT: &str = "Ctrl+Shift+Space";
#[cfg(desktop)]
const TOGGLE_OVERLAY_CLI_ARG: &str = "--toggle-overlay";
#[cfg(all(desktop, target_os = "linux"))]
const HYPRLAND_BIND_FILE_NAME: &str = "overlay-core-hotkeys.conf";

#[cfg(desktop)]
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
enum HotkeyAction {
    ToggleOverlayVisibility,
}

#[cfg(desktop)]
const SUPPORTED_HOTKEY_ACTIONS: [HotkeyAction; 1] = [HotkeyAction::ToggleOverlayVisibility];

#[cfg(desktop)]
#[derive(Clone, Debug, Serialize)]
struct HotkeyBinding {
    action: HotkeyAction,
    accelerator: String,
}

#[cfg(desktop)]
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct HotkeyPlatformInfo {
    is_linux: bool,
    is_wayland: bool,
    is_hyprland: bool,
    supports_native_global_shortcuts: bool,
    can_auto_configure_hyprland: bool,
}

#[cfg(desktop)]
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct HyprlandHotkeyApplyResult {
    bind_file_path: String,
    main_config_path: String,
    source_line: String,
    bind_line: String,
}

#[cfg(desktop)]
struct HotkeyBindingsState {
    bindings: Mutex<HashMap<HotkeyAction, String>>,
}

#[cfg(desktop)]
impl HotkeyBindingsState {
    fn with_defaults() -> Self {
        let mut bindings = HashMap::new();
        bindings.insert(
            HotkeyAction::ToggleOverlayVisibility,
            DEFAULT_TOGGLE_OVERLAY_SHORTCUT.to_string(),
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
fn hotkey_action_key(action: HotkeyAction) -> &'static str {
    match action {
        HotkeyAction::ToggleOverlayVisibility => "toggle_overlay_visibility",
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
fn resolve_hotkey_platform_info() -> HotkeyPlatformInfo {
    #[cfg(target_os = "linux")]
    {
        let is_wayland = std::env::var_os("WAYLAND_DISPLAY").is_some();
        let is_x11 = std::env::var_os("DISPLAY").is_some();
        let is_hyprland = std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_some();
        let has_hyprctl = Command::new("hyprctl")
            .arg("version")
            .status()
            .is_ok_and(|status| status.success());

        HotkeyPlatformInfo {
            is_linux: true,
            is_wayland,
            is_hyprland,
            supports_native_global_shortcuts: is_x11,
            can_auto_configure_hyprland: is_hyprland && has_hyprctl,
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        HotkeyPlatformInfo {
            is_linux: false,
            is_wayland: false,
            is_hyprland: false,
            supports_native_global_shortcuts: true,
            can_auto_configure_hyprland: false,
        }
    }
}

#[cfg(all(desktop, target_os = "linux"))]
fn hyprland_config_dir() -> Result<PathBuf, String> {
    if let Some(xdg_config_home) = std::env::var_os("XDG_CONFIG_HOME") {
        return Ok(PathBuf::from(xdg_config_home).join("hypr"));
    }

    if let Some(home) = std::env::var_os("HOME") {
        return Ok(PathBuf::from(home).join(".config/hypr"));
    }

    Err("failed to locate HOME/XDG_CONFIG_HOME for Hyprland config".to_string())
}

#[cfg(all(desktop, target_os = "linux"))]
fn hyprland_bind_file_path() -> Result<PathBuf, String> {
    Ok(hyprland_config_dir()?.join(HYPRLAND_BIND_FILE_NAME))
}

#[cfg(all(desktop, target_os = "linux"))]
fn hyprland_main_config_path() -> Result<PathBuf, String> {
    Ok(hyprland_config_dir()?.join("hyprland.conf"))
}

#[cfg(all(desktop, target_os = "linux"))]
fn hyprland_command_prefix() -> String {
    let exe_path = std::env::current_exe()
        .ok()
        .map(|path| path.to_string_lossy().to_string())
        .filter(|path| !path.is_empty())
        .unwrap_or_else(|| "overlay-core".to_string());

    if exe_path.contains(' ') {
        return format!("\"{exe_path}\"");
    }

    exe_path
}

#[cfg(all(desktop, target_os = "linux"))]
fn hyprland_key_name(shortcut: Shortcut) -> Option<String> {
    let key = shortcut.key.to_string();

    if let Some(letter) = key.strip_prefix("Key") {
        return Some(letter.to_uppercase());
    }

    if let Some(digit) = key.strip_prefix("Digit") {
        return Some(digit.to_string());
    }

    if key.starts_with('F') && key[1..].chars().all(|ch| ch.is_ascii_digit()) {
        return Some(key.to_uppercase());
    }

    let mapped = match key.as_str() {
        "Space" => "SPACE",
        "Tab" => "TAB",
        "Enter" => "RETURN",
        "Escape" => "ESCAPE",
        "Backspace" => "BACKSPACE",
        "Delete" => "DELETE",
        "Home" => "HOME",
        "End" => "END",
        "PageUp" => "PAGEUP",
        "PageDown" => "PAGEDOWN",
        "Insert" => "INSERT",
        "ArrowUp" => "UP",
        "ArrowDown" => "DOWN",
        "ArrowLeft" => "LEFT",
        "ArrowRight" => "RIGHT",
        "Minus" => "MINUS",
        "Equal" => "EQUAL",
        "Comma" => "COMMA",
        "Period" => "PERIOD",
        "Slash" => "SLASH",
        "Semicolon" => "SEMICOLON",
        "Quote" => "APOSTROPHE",
        "Backquote" => "GRAVE",
        "Backslash" => "BACKSLASH",
        "BracketLeft" => "LEFTBRACKET",
        "BracketRight" => "RIGHTBRACKET",
        _ => return None,
    };

    Some(mapped.to_string())
}

#[cfg(all(desktop, target_os = "linux"))]
fn hyprland_bind_line_for_accelerator(accelerator: &str) -> Result<String, String> {
    let shortcut = accelerator.parse::<Shortcut>().map_err(|error| {
        format!("cannot convert hotkey '{accelerator}' to Hyprland format: {error}")
    })?;

    let key = hyprland_key_name(shortcut).ok_or_else(|| {
        format!(
            "key '{}' is not supported by automatic Hyprland mapping yet",
            shortcut.key
        )
    })?;

    let mut modifiers: Vec<&str> = Vec::new();
    if shortcut.mods.contains(Modifiers::SUPER) {
        modifiers.push("SUPER");
    }
    if shortcut.mods.contains(Modifiers::SHIFT) {
        modifiers.push("SHIFT");
    }
    if shortcut.mods.contains(Modifiers::CONTROL) {
        modifiers.push("CTRL");
    }
    if shortcut.mods.contains(Modifiers::ALT) {
        modifiers.push("ALT");
    }

    let mods = modifiers.join(" ");
    let command = format!("{} {}", hyprland_command_prefix(), TOGGLE_OVERLAY_CLI_ARG);

    if mods.is_empty() {
        return Ok(format!("bind = , {key}, exec, {command}"));
    }

    Ok(format!("bind = {mods}, {key}, exec, {command}"))
}

#[cfg(all(desktop, target_os = "linux"))]
fn write_hyprland_bind_config(bind_line: &str) -> Result<HyprlandHotkeyApplyResult, String> {
    let bind_file = hyprland_bind_file_path()?;
    let main_config = hyprland_main_config_path()?;

    let config_dir = hyprland_config_dir()?;
    fs::create_dir_all(&config_dir).map_err(|error| {
        format!(
            "failed to create Hyprland config directory '{}': {error}",
            config_dir.display(),
        )
    })?;

    let bind_file_content =
        format!("# Managed by overlay-core. Update from app settings.\n{bind_line}\n");
    fs::write(&bind_file, bind_file_content).map_err(|error| {
        format!(
            "failed to write Hyprland bind file '{}': {error}",
            bind_file.display(),
        )
    })?;

    let source_line = format!("source = {}", bind_file.display());
    let mut main_content = if main_config.exists() {
        fs::read_to_string(&main_config).map_err(|error| {
            format!(
                "failed to read Hyprland main config '{}': {error}",
                main_config.display(),
            )
        })?
    } else {
        String::new()
    };

    if !main_content.contains(&source_line) {
        if !main_content.is_empty() && !main_content.ends_with('\n') {
            main_content.push('\n');
        }

        main_content.push_str("\n# Added by overlay-core for hotkeys.\n");
        main_content.push_str(&source_line);
        main_content.push('\n');

        fs::write(&main_config, main_content).map_err(|error| {
            format!(
                "failed to write Hyprland main config '{}': {error}",
                main_config.display(),
            )
        })?;
    }

    let reload_status = Command::new("hyprctl")
        .arg("reload")
        .status()
        .map_err(|error| format!("failed to run 'hyprctl reload': {error}"))?;

    if !reload_status.success() {
        return Err(format!(
            "'hyprctl reload' failed with status {}",
            reload_status
        ));
    }

    Ok(HyprlandHotkeyApplyResult {
        bind_file_path: bind_file.display().to_string(),
        main_config_path: main_config.display().to_string(),
        source_line,
        bind_line: bind_line.to_string(),
    })
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
    apply_overlay_flag("minimizable", window.set_minimizable(false));
    apply_overlay_flag("always_on_top", window.set_always_on_top(true));
    apply_overlay_flag("content_protected", window.set_content_protected(true));
    apply_overlay_flag("skip_taskbar", window.set_skip_taskbar(true));
    apply_overlay_flag(
        "visible_on_all_workspaces",
        window.set_visible_on_all_workspaces(true),
    );
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
        window
            .hide()
            .map_err(|error| format!("failed to hide overlay window: {error}"))?;
    } else {
        window
            .show()
            .map_err(|error| format!("failed to show overlay window: {error}"))?;

        configure_overlay_window(&window);
        #[cfg(target_os = "linux")]
        configure_hyprland_overlay_window();

        if let Err(error) = window.set_focus() {
            eprintln!("failed to focus overlay window after show: {error}");
        }
    }

    Ok(())
}

#[cfg(desktop)]
fn run_hotkey_action(app: &AppHandle, action: HotkeyAction) -> Result<(), String> {
    match action {
        HotkeyAction::ToggleOverlayVisibility => toggle_overlay_visibility(app),
    }
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
fn get_hotkey_platform_info() -> HotkeyPlatformInfo {
    resolve_hotkey_platform_info()
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

#[cfg(desktop)]
#[tauri::command]
fn apply_hyprland_hotkey_binding(
    hotkeys: tauri::State<'_, HotkeyBindingsState>,
    action: HotkeyAction,
) -> Result<HyprlandHotkeyApplyResult, String> {
    let accelerator = hotkeys
        .get(action)
        .ok_or_else(|| format!("unsupported hotkey action '{}'", hotkey_action_key(action)))?;

    #[cfg(target_os = "linux")]
    {
        let platform_info = resolve_hotkey_platform_info();
        if !platform_info.can_auto_configure_hyprland {
            return Err(
                "automatic Hyprland apply is available only in active Hyprland sessions"
                    .to_string(),
            );
        }

        let bind_line = hyprland_bind_line_for_accelerator(&accelerator)?;
        write_hyprland_bind_config(&bind_line)
    }

    #[cfg(not(target_os = "linux"))]
    {
        Err("automatic Hyprland apply is supported only on Linux".to_string())
    }
}

#[cfg(all(desktop, target_os = "linux"))]
fn should_warn_about_wayland_hotkeys() -> bool {
    std::env::var_os("WAYLAND_DISPLAY").is_some() && std::env::var_os("DISPLAY").is_none()
}

#[cfg(all(desktop, target_os = "linux"))]
fn log_wayland_hotkey_fallback_hint() {
    if should_warn_about_wayland_hotkeys() {
        eprintln!(
            "global shortcuts use the Linux X11 backend and may not fire on pure Wayland sessions; \
use Settings -> Hotkeys -> Apply to Hyprland, or set a compositor hotkey to run `overlay-core {TOGGLE_OVERLAY_CLI_ARG}`."
        );
    }
}

#[cfg(all(desktop, target_os = "linux"))]
#[derive(Deserialize)]
struct HyprClient {
    address: String,
    pid: u32,
    class: String,
    #[serde(default)]
    title: String,
    #[serde(default)]
    floating: bool,
    #[serde(default)]
    pinned: bool,
}

#[cfg(all(desktop, target_os = "linux"))]
fn apply_hyprland_dispatch(dispatcher: &str, argument: &str) {
    match Command::new("hyprctl")
        .arg("dispatch")
        .arg(dispatcher)
        .arg(argument)
        .status()
    {
        Ok(status) if status.success() => {}
        Ok(status) => {
            eprintln!("failed Hyprland dispatch '{dispatcher}' (status {status}): {argument}")
        }
        Err(error) => eprintln!("failed to run hyprctl dispatch '{dispatcher}': {error}"),
    }
}

#[cfg(all(desktop, target_os = "linux"))]
fn find_hyprland_overlay_client(pid: u32) -> Option<HyprClient> {
    let output = match Command::new("hyprctl").arg("-j").arg("clients").output() {
        Ok(output) => output,
        Err(error) => {
            eprintln!("failed to run hyprctl clients query: {error}");
            return None;
        }
    };

    if !output.status.success() {
        eprintln!(
            "hyprctl clients query returned non-zero status: {}",
            output.status
        );
        return None;
    }

    let clients: Vec<HyprClient> = match serde_json::from_slice(&output.stdout) {
        Ok(clients) => clients,
        Err(error) => {
            eprintln!("failed to parse hyprctl clients output: {error}");
            return None;
        }
    };

    clients.into_iter().find(|client| {
        client.pid == pid && (client.class == "overlay-core" || client.title == "overlay-core")
    })
}

#[cfg(all(desktop, target_os = "linux"))]
fn configure_hyprland_overlay_window() {
    if std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_none() {
        return;
    }

    let pid = std::process::id();
    thread::spawn(move || {
        for _attempt in 0..20 {
            if let Some(client) = find_hyprland_overlay_client(pid) {
                let address_arg = format!("address:{}", client.address);
                if !client.floating {
                    apply_hyprland_dispatch("setfloating", &address_arg);
                }
                if !client.pinned {
                    apply_hyprland_dispatch("pin", &address_arg);
                }
                let no_screen_share_arg = format!("address:{} no_screen_share 1", client.address);
                apply_hyprland_dispatch("setprop", &no_screen_share_arg);
                return;
            }

            thread::sleep(Duration::from_millis(100));
        }

        eprintln!("overlay window was not found in Hyprland clients list");
    });
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
            get_hotkey_platform_info,
            update_hotkey_binding,
            apply_hyprland_hotkey_binding,
        ]);

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.manage(HotkeyBindingsState::with_defaults());

                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle()
                    .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

                let hotkey_bindings = app.state::<HotkeyBindingsState>().list();
                if let Err(error) = register_hotkey_bindings(app.handle(), &hotkey_bindings) {
                    eprintln!("failed to register startup hotkeys: {error}");
                }

                #[cfg(target_os = "linux")]
                log_wayland_hotkey_fallback_hint();

                if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
                    configure_overlay_window(&window);
                    #[cfg(target_os = "linux")]
                    configure_hyprland_overlay_window();
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
