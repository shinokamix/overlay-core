// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(not(target_os = "windows"))]
compile_error!("overlay-core supports Windows only. Build with a Windows target.");

fn main() {
    overlay_core_lib::run()
}
