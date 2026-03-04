mod app;
#[cfg(desktop)]
mod features;
#[cfg(desktop)]
mod shared;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    app::bootstrap::run();
}
