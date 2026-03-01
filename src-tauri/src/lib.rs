#[cfg(all(desktop, target_os = "linux"))]
use serde::Deserialize;
#[cfg(all(desktop, target_os = "linux"))]
use std::{process::Command, thread, time::Duration};
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
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;

                if let Some(window) = app.get_webview_window("main") {
                    configure_overlay_window(&window);
                    #[cfg(target_os = "linux")]
                    configure_hyprland_overlay_window();
                } else {
                    eprintln!("main window not found: overlay flags were not applied");
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
