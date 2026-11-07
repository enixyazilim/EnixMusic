// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    unsafe {
        // Disable CSP enforcement and allow seamless Web Audio / Injected scripts
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--disable-web-security --autoplay-policy=no-user-gesture-required",
        );
    }

    app_lib::run();
}
