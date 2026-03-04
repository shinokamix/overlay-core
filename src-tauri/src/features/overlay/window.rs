use tauri::WebviewWindow;

fn apply_overlay_flag(flag: &str, result: tauri::Result<()>) {
    if let Err(error) = result {
        eprintln!("failed to apply overlay window flag '{flag}': {error}");
    }
}

pub fn configure_overlay_window(window: &WebviewWindow) {
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

pub fn apply_default_cursor_behavior(window: &WebviewWindow) {
    apply_overlay_flag(
        "ignore_cursor_events",
        window.set_ignore_cursor_events(true),
    );
}
