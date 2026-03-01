#[cfg(desktop)]
use tauri::{Manager, WebviewWindow};

#[cfg(desktop)]
fn apply_overlay_flag(flag: &str, result: tauri::Result<()>) {
    if let Err(error) = result {
        eprintln!("failed to apply overlay window flag '{flag}': {error}");
    }
}

#[cfg(desktop)]
fn configure_overlay_window(window: &WebviewWindow) {
    apply_overlay_flag("always_on_top", window.set_always_on_top(true));
    apply_overlay_flag("content_protected", window.set_content_protected(true));
    apply_overlay_flag("skip_taskbar", window.set_skip_taskbar(true));
    apply_overlay_flag(
        "visible_on_all_workspaces",
        window.set_visible_on_all_workspaces(true),
    );
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;

                if let Some(window) = app.get_webview_window("main") {
                    configure_overlay_window(&window);
                } else {
                    eprintln!("main window not found: overlay flags were not applied");
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
