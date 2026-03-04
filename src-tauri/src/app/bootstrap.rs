#[cfg(desktop)]
use crate::app::{commands, state};
#[cfg(desktop)]
use crate::features::{hotkeys, overlay};
#[cfg(desktop)]
use crate::shared::constants::TOGGLE_OVERLAY_CLI_ARG;

#[cfg(desktop)]
fn args_request_overlay_toggle(args: &[String]) -> bool {
    args.iter().any(|arg| arg == TOGGLE_OVERLAY_CLI_ARG)
}

#[cfg(desktop)]
fn handle_overlay_toggle_request(app: &tauri::AppHandle, source: &str) {
    if let Err(error) = overlay::service::toggle_overlay_visibility(app) {
        eprintln!("failed to toggle overlay visibility from {source}: {error}");
    }
}

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
            commands::get_hotkey_bindings,
            commands::update_hotkey_binding,
            commands::get_overlay_interaction_enabled,
            commands::set_overlay_interaction_enabled_command,
            commands::toggle_overlay_interaction_enabled_command
        ]);

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                state::register(app);

                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle()
                    .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

                if let Err(error) = hotkeys::service::register_startup_hotkey_bindings(app.handle())
                {
                    eprintln!("failed to register startup hotkeys: {error}");
                }

                overlay::service::configure_main_window_on_startup(app.handle());

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
