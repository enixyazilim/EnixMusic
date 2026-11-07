use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let now_playing_item = MenuItemBuilder::with_id("now_playing", "Enix Music - Hazır")
        .enabled(false)
        .build(app)?;

    let play_pause_item = MenuItemBuilder::with_id("play_pause", "Oynat / Duraklat").build(app)?;
    let next_item = MenuItemBuilder::with_id("next", "Sonraki Şarkı").build(app)?;
    let prev_item = MenuItemBuilder::with_id("prev", "Önceki Şarkı").build(app)?;
    let video_toggle_item = MenuItemBuilder::with_id("video_toggle", "Müzik / Video Modu").build(app)?;
    let settings_item = MenuItemBuilder::with_id("settings", "Ayarlar").build(app)?;
    let check_updates_item = MenuItemBuilder::with_id("check_updates", "Güncellemeleri Denetle").build(app)?;
    let show_item = MenuItemBuilder::with_id("show", "Göster / Gizle").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Çıkış").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&now_playing_item)
        .separator()
        .item(&play_pause_item)
        .item(&next_item)
        .item(&prev_item)
        .separator()
        .item(&video_toggle_item)
        .separator()
        .item(&settings_item)
        .item(&check_updates_item)
        .separator()
        .item(&show_item)
        .item(&quit_item)
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Enix Music")
        .on_menu_event(move |app_handle, event| match event.id().as_ref() {
            "play_pause" => {
                if let Some(win) = app_handle.get_webview_window("main") {
                    let _ = win.eval("window.enixPlayer && window.enixPlayer.togglePlay()");
                }
            }
            "next" => {
                if let Some(win) = app_handle.get_webview_window("main") {
                    let _ = win.eval("window.enixPlayer && window.enixPlayer.next()");
                }
            }
            "prev" => {
                if let Some(win) = app_handle.get_webview_window("main") {
                    let _ = win.eval("window.enixPlayer && window.enixPlayer.previous()");
                }
            }
            "video_toggle" => {
                if let Some(win) = app_handle.get_webview_window("main") {
                    let _ = win.eval("window.enixPlayer && window.enixPlayer.toggleVideoMode()");
                }
            }
            "settings" => {
                if let Some(win) = app_handle.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    #[cfg(target_os = "windows")]
                    crate::taskbar::win::restore_taskbar_buttons(app_handle);
                    let _ = win.eval("window.__enix__ && window.__enix__.openSettings && window.__enix__.openSettings()");
                }
            }
            "check_updates" => {
                let handle = app_handle.clone();
                std::thread::spawn(move || {
                    if let Ok(info) = crate::updater::check_for_updates(&handle, true) {
                        if info.has_update {
                            crate::updater::open_release_page(&info.release_url);
                        }
                    }
                });
            }
            "show" => {
                if let Some(win) = app_handle.get_webview_window("main") {
                    if win.is_visible().unwrap_or(false) {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                        let _ = win.set_focus();
                        #[cfg(target_os = "windows")]
                        crate::taskbar::win::restore_taskbar_buttons(app_handle);
                    }
                }
            }
            "quit" => {
                app_handle.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    if win.is_visible().unwrap_or(false) {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                        let _ = win.set_focus();
                        #[cfg(target_os = "windows")]
                        crate::taskbar::win::restore_taskbar_buttons(app);
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
