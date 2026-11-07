mod discord;
mod smtc;
mod state;
mod taskbar;
mod tray;
mod updater;

use discord::DiscordService;
use smtc::SmtcService;
use state::{AppState, TrackState};
use updater::UpdateInfo;

use log::info;
use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use std::sync::{Arc, Mutex};
use tauri::{
    AppHandle, Listener, Manager, State, WebviewUrl, WebviewWindowBuilder,
};

#[cfg(target_os = "windows")]
use taskbar::win::TaskbarController;

const INJECTED_BUNDLE: &str = include_str!("../../injected/bundle.js");

#[tauri::command]
fn update_track_state(
    state: TrackState,
    app_state: State<'_, AppState>,
    discord: State<'_, DiscordService>,
    smtc: State<'_, Arc<Mutex<Option<SmtcService>>>>,
    #[cfg(target_os = "windows")]
    taskbar: State<'_, Arc<Mutex<Option<TaskbarController>>>>,
) -> Result<(), String> {
    if let Ok(mut lock) = app_state.track.lock() {
        *lock = state.clone();
    }

    discord.update(state.clone());

    if let Ok(lock) = smtc.lock() {
        if let Some(ref s) = *lock {
            s.update(&state);
        }
    }

    #[cfg(target_os = "windows")]
    if let Ok(tb_lock) = taskbar.lock() {
        if let Some(ref tb) = *tb_lock {
            tb.update_play_state(state.is_playing);
        }
    }

    Ok(())
}

#[tauri::command]
fn get_track_state(app_state: State<'_, AppState>) -> Result<TrackState, String> {
    if let Ok(lock) = app_state.track.lock() {
        Ok(lock.clone())
    } else {
        Err("Failed to lock state".to_string())
    }
}

#[tauri::command]
fn check_app_updates(app: AppHandle) -> Result<UpdateInfo, String> {
    updater::check_for_updates(&app, true)
}

#[cfg(target_os = "windows")]
pub fn set_window_app_id(hwnd: *mut std::ffi::c_void, app_id: &str) {
    use windows::core::{GUID, PWSTR};
    use windows::Win32::Foundation::{HWND, PROPERTYKEY};
    use windows::Win32::System::Com::StructuredStorage::PROPVARIANT;
    use windows::Win32::UI::Shell::PropertiesSystem::{IPropertyStore, SHGetPropertyStoreForWindow};

    let pkey = PROPERTYKEY {
        fmtid: GUID::from_u128(0x9F4C2855_9F79_4B39_A8D0_E1D42DE1D5F3),
        pid: 5,
    };
    let mut wide_id: Vec<u16> = app_id.encode_utf16().chain(std::iter::once(0)).collect();

    unsafe {
        if let Ok(store) = SHGetPropertyStoreForWindow::<IPropertyStore>(HWND(hwnd)) {
            let mut pv = PROPVARIANT::default();
            (*pv.Anonymous.Anonymous).vt = windows::Win32::System::Variant::VARENUM(31); // VT_LPWSTR = 31
            (*pv.Anonymous.Anonymous).Anonymous.pwszVal = PWSTR(wide_id.as_mut_ptr());
            let _ = store.SetValue(&pkey, &pv);
            let _ = store.Commit();
            // Prevent PropVariantClear from freeing Rust-allocated Vec memory
            (*pv.Anonymous.Anonymous).vt = windows::Win32::System::Variant::VARENUM(0); // VT_EMPTY
            log::info!("Successfully set PKEY_AppUserModel_ID on window HWND: {}", app_id);
        }
    }
}

#[cfg(target_os = "windows")]
fn init_windows_app_identity() {
    #[link(name = "shell32")]
    unsafe extern "system" {
        fn SetCurrentProcessExplicitAppUserModelID(AppID: *const u16) -> i32;
    }

    let aumid: Vec<u16> = "com.enixyazilim.enixmusic\0".encode_utf16().collect();
    unsafe {
        let _ = SetCurrentProcessExplicitAppUserModelID(aumid.as_ptr());
    }
}

#[cfg(target_os = "windows")]
fn set_windows_autostart(enabled: bool) {
    use windows::Win32::System::Registry::{
        RegCloseKey, RegDeleteValueW, RegOpenKeyExW, RegSetValueExW, HKEY, HKEY_CURRENT_USER,
        KEY_SET_VALUE, REG_SZ,
    };

    let subkey: Vec<u16> = "Software\\Microsoft\\Windows\\CurrentVersion\\Run\0"
        .encode_utf16()
        .collect();
    let value_name: Vec<u16> = "EnixMusic\0".encode_utf16().collect();

    unsafe {
        let mut hkey = HKEY::default();
        if RegOpenKeyExW(
            HKEY_CURRENT_USER,
            windows::core::PCWSTR(subkey.as_ptr()),
            Some(0),
            KEY_SET_VALUE,
            &mut hkey,
        )
        .is_ok()
        {
            if enabled {
                if let Ok(exe_path) = std::env::current_exe() {
                    let path_str = format!("\"{}\"", exe_path.to_string_lossy());
                    let wide_path: Vec<u16> =
                        path_str.encode_utf16().chain(std::iter::once(0)).collect();
                    let _ = RegSetValueExW(
                        hkey,
                        windows::core::PCWSTR(value_name.as_ptr()),
                        Some(0),
                        REG_SZ,
                        Some(std::slice::from_raw_parts(
                            wide_path.as_ptr() as *const u8,
                            wide_path.len() * 2,
                        )),
                    );
                }
            } else {
                let _ = RegDeleteValueW(hkey, windows::core::PCWSTR(value_name.as_ptr()));
            }
            let _ = RegCloseKey(hkey);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    init_windows_app_identity();

    let app_state = AppState::default();
    let discord_service = DiscordService::new();
    let smtc_holder: Arc<Mutex<Option<SmtcService>>> = Arc::new(Mutex::new(None));

    #[cfg(target_os = "windows")]
    let taskbar_holder: Arc<Mutex<Option<TaskbarController>>> = Arc::new(Mutex::new(None));

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(app_state.clone())
        .manage(discord_service.clone())
        .manage(smtc_holder.clone());

    #[cfg(target_os = "windows")]
    {
        builder = builder.manage(taskbar_holder.clone());
    }

    builder
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app_state = window.state::<AppState>();
                let hide = app_state.hide_to_tray.load(std::sync::atomic::Ordering::Relaxed);
                log::info!("WindowEvent::CloseRequested received: hide_to_tray={}", hide);
                if hide {
                    api.prevent_close();
                    let _ = window.hide();
                } else {
                    let app = window.app_handle();
                    app.exit(0);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![update_track_state, get_track_state, check_app_updates])
        .setup(move |app| {
            let handle = app.handle().clone();

            // Setup System Tray
            if let Err(e) = tray::setup_tray(&handle) {
                log::warn!("System tray setup warning: {}", e);
            }

            // Real-time Event Listener from https://music.youtube.com (authorized via remote capabilities)
            let discord_svc = discord_service.clone();
            let smtc_h = smtc_holder.clone();
            #[cfg(target_os = "windows")]
            let taskbar_h = taskbar_holder.clone();
            let app_st = app_state.clone();
            let app_st_settings = app_state.clone();

            handle.listen("enix-settings-changed", move |event| {
                let payload = event.payload();
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(payload) {
                    if let Some(hide) = val["hide_to_tray"].as_bool() {
                        app_st_settings.hide_to_tray.store(hide, std::sync::atomic::Ordering::Relaxed);
                        log::info!("Updated hide_to_tray setting from frontend event: {}", hide);
                        let mut cfg = state::load_app_config();
                        cfg.hide_to_tray = hide;
                        state::save_app_config(&cfg);
                    }
                    if let Some(autostart) = val["autostart"].as_bool() {
                        #[cfg(target_os = "windows")]
                        set_windows_autostart(autostart);
                        log::info!("Updated autostart setting from frontend event: {}", autostart);
                        let mut cfg = state::load_app_config();
                        cfg.autostart = autostart;
                        state::save_app_config(&cfg);
                    }
                }
            });

            handle.listen("enix-state", move |event| {
                let payload = event.payload();
                let Ok(val) = serde_json::from_str::<serde_json::Value>(payload) else {
                    log::error!("Failed to parse enix-state JSON: {}", payload);
                    return;
                };

                let title = val["title"].as_str().unwrap_or("").to_string();
                let artist = val["artist"].as_str().unwrap_or("").to_string();
                let album = val["album"].as_str().unwrap_or("").to_string();
                let album_art = val["album_art"].as_str().unwrap_or("").to_string();
                let duration = val["duration"].as_f64().unwrap_or(0.0);
                let progress = val["progress"].as_f64().unwrap_or(0.0);
                let is_playing = val["is_playing"].as_bool()
                    .or_else(|| val["playing"].as_bool())
                    .unwrap_or(false);
                let is_video_mode = val["is_video_mode"].as_bool().unwrap_or(false);
                let volume = val["volume"].as_f64().unwrap_or(1.0);
                let is_muted = val["is_muted"].as_bool().unwrap_or(false);

                let state = TrackState {
                    title: title.clone(),
                    artist: artist.clone(),
                    album,
                    album_art,
                    duration,
                    progress,
                    is_playing,
                    is_video_mode,
                    volume,
                    is_muted,
                };

                if let Some(hide) = val["hide_to_tray"].as_bool() {
                    let old = app_st.hide_to_tray.swap(hide, std::sync::atomic::Ordering::Relaxed);
                    if old != hide {
                        log::info!("Updated hide_to_tray from state: {}", hide);
                    }
                }
                if let Some(autostart) = val["autostart"].as_bool() {
                    #[cfg(target_os = "windows")]
                    set_windows_autostart(autostart);
                }

                log::info!("Player state updated: title='{}', artist='{}', is_playing={}", title, artist, is_playing);

                if let Ok(mut track_lock) = app_st.track.lock() {
                    *track_lock = state.clone();
                }
                discord_svc.update(state.clone());
                if let Ok(lock) = smtc_h.lock() {
                    if let Some(ref s) = *lock {
                        s.update(&state);
                    }
                }
                #[cfg(target_os = "windows")]
                {
                    if let Ok(lock) = taskbar_h.lock() {
                        if let Some(ref tb) = *lock {
                            tb.update_play_state(state.is_playing);
                        }
                    }
                }
            });

            // Create or configure the main window
            let ytm_url = "https://music.youtube.com".parse().map_err(|e| {
                tauri::Error::AssetNotFound(format!("Invalid URL: {}", e))
            })?;

            let mut win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::External(ytm_url))
                .title("Enix Music")
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
                .inner_size(1280.0, 800.0)
                .min_inner_size(800.0, 600.0)
                .devtools(true)
                .initialization_script(INJECTED_BUNDLE)
                .on_page_load(|window, payload| {
                    if payload.event() == tauri::webview::PageLoadEvent::Finished {
                        log::info!("Page load finished for: {}, injecting bundle...", payload.url());
                        if let Err(e) = window.eval(INJECTED_BUNDLE) {
                            log::error!("Error evaluating injected bundle: {}", e);
                        } else {
                            log::info!("Injected bundle evaluated successfully!");
                        }
                    }
                });

            #[cfg(target_os = "windows")]
            {
                win_builder = win_builder.additional_browser_args(
                    "--disable-features=HardwareMediaKeyHandling,MediaSessionService,msWebOOUI,msPdfOOUI,msSmartScreenProtection"
                );
            }

            let window = win_builder.build()?;

            // Multi-stage injection assurance timer
            let win_timer = window.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(1500)).await;
                let _ = win_timer.eval(INJECTED_BUNDLE);
                tokio::time::sleep(std::time::Duration::from_millis(3000)).await;
                let _ = win_timer.eval(INJECTED_BUNDLE);
            });

            // Set PKEY_AppUserModel_ID on HWND before binding SMTC
            #[cfg(target_os = "windows")]
            {
                if let Ok(wh) = window.window_handle() {
                    if let RawWindowHandle::Win32(h) = wh.as_raw() {
                        set_window_app_id(h.hwnd.get() as *mut std::ffi::c_void, "com.enixyazilim.enixmusic");
                    }
                }
            }

            // Initialize Windows SMTC & Media Controls
            let smtc_service = SmtcService::new(handle.clone(), &window);
            if let Ok(mut lock) = smtc_holder.lock() {
                *lock = Some(smtc_service);
            }

            // Initialize Taskbar Buttons on Windows
            #[cfg(target_os = "windows")]
            {
                if let Ok(wh) = window.window_handle() {
                    if let RawWindowHandle::Win32(h) = wh.as_raw() {
                        let tb = TaskbarController::new(h.hwnd.get() as *mut std::ffi::c_void, handle.clone());
                        tb.init_buttons();
                        if let Ok(mut tb_lock) = taskbar_holder.lock() {
                            *tb_lock = Some(tb);
                        }
                    }
                }
            }

            // Robust Rust-to-Webview State Polling Loop (bypasses remote CSP & IPC restrictions)
            let win_poller = window.clone();
            let discord_poller = discord_service.clone();
            let smtc_poller = smtc_holder.clone();
            #[cfg(target_os = "windows")]
            let taskbar_poller = taskbar_holder.clone();
            let app_st_poller = app_state.clone();

            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_millis(200));
                loop {
                    interval.tick().await;

                    let discord_c = discord_poller.clone();
                    let smtc_c = smtc_poller.clone();
                    #[cfg(target_os = "windows")]
                    let taskbar_c = taskbar_poller.clone();
                    let app_st_c = app_st_poller.clone();

                    let _ = win_poller.eval_with_callback(
                        r#"(() => {
                            try {
                                if (typeof window.enixGetState === 'function') {
                                    return window.enixGetState();
                                }
                                const v = Array.from(document.querySelectorAll('video')).find(x => !x.paused && !x.ended) || document.querySelector('video');
                                const playBtn = document.querySelector('#play-pause-button, #play-pause-button button');
                                const label = (playBtn?.getAttribute('aria-label') || playBtn?.getAttribute('title') || '').toLowerCase();
                                const is_playing = (label.includes('duraklat') || label.includes('pause')) || Boolean(v && !v.paused && !v.ended);
                                const titleEl = document.querySelector('.title.ytmusic-player-bar');
                                const bylineEl = document.querySelector('.byline.ytmusic-player-bar');
                                const title = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent || '').trim() : '';
                                const artist = bylineEl ? (bylineEl.textContent || '').trim().split('•')[0].trim() : '';
                                const hide_to_tray = localStorage.getItem('enix_hide_to_tray') !== null
                                    ? localStorage.getItem('enix_hide_to_tray') === 'true'
                                    : true;
                                const autostart = localStorage.getItem('enix_autostart') !== null
                                    ? localStorage.getItem('enix_autostart') === 'true'
                                    : false;
                                return {
                                    title,
                                    artist,
                                    album: '',
                                    album_art: '',
                                    duration: v?.duration || 0,
                                    progress: v?.currentTime || 0,
                                    is_playing: Boolean(is_playing),
                                    is_video_mode: false,
                                    volume: v?.volume ?? 1,
                                    is_muted: Boolean(v?.muted),
                                    hide_to_tray,
                                    autostart
                                };
                            } catch (_) {
                                return null;
                            }
                        })()"#,
                        move |raw_json| {
                            if raw_json.is_empty() || raw_json == "null" {
                                return;
                            }

                            let val: serde_json::Value = match serde_json::from_str(&raw_json) {
                                Ok(serde_json::Value::String(inner)) => {
                                    serde_json::from_str(&inner).unwrap_or(serde_json::Value::Null)
                                }
                                Ok(v) => v,
                                Err(_) => return,
                            };

                            if val.is_null() {
                                return;
                            }

                            // Sync settings dynamically from frontend state
                            if let Some(hide) = val["hide_to_tray"].as_bool() {
                                let old = app_st_c.hide_to_tray.swap(hide, std::sync::atomic::Ordering::Relaxed);
                                if old != hide {
                                    log::info!("Updated hide_to_tray from poller callback: {}", hide);
                                    let mut cfg = state::load_app_config();
                                    cfg.hide_to_tray = hide;
                                    state::save_app_config(&cfg);
                                }
                            }
                            if let Some(autostart) = val["autostart"].as_bool() {
                                #[cfg(target_os = "windows")]
                                set_windows_autostart(autostart);
                                let mut cfg = state::load_app_config();
                                if cfg.autostart != autostart {
                                    cfg.autostart = autostart;
                                    state::save_app_config(&cfg);
                                }
                            }

                            let title = val["title"].as_str().unwrap_or("").to_string();
                            let artist = val["artist"].as_str().unwrap_or("").to_string();
                            let album = val["album"].as_str().unwrap_or("").to_string();
                            let album_art = val["album_art"].as_str().unwrap_or("").to_string();
                            let duration = val["duration"].as_f64().unwrap_or(0.0);
                            let progress = val["progress"].as_f64().unwrap_or(0.0);
                            let is_playing = val["is_playing"]
                                .as_bool()
                                .or_else(|| val["playing"].as_bool())
                                .unwrap_or(false);
                            let is_video_mode = val["is_video_mode"].as_bool().unwrap_or(false);
                            let volume = val["volume"].as_f64().unwrap_or(1.0);
                            let is_muted = val["is_muted"].as_bool().unwrap_or(false);

                            let state = TrackState {
                                title: title.clone(),
                                artist: artist.clone(),
                                album,
                                album_art,
                                duration,
                                progress,
                                is_playing,
                                is_video_mode,
                                volume,
                                is_muted,
                            };

                            let mut state_changed = false;
                            if let Ok(mut track_lock) = app_st_c.track.lock() {
                                if track_lock.is_playing != is_playing || track_lock.title != title || track_lock.artist != artist {
                                    state_changed = true;
                                    log::info!(
                                        "Player state updated: title='{}', artist='{}', is_playing={}",
                                        title, artist, is_playing
                                    );
                                    *track_lock = state.clone();
                                } else {
                                    track_lock.progress = progress;
                                    track_lock.duration = duration;
                                }
                            }

                            #[cfg(target_os = "windows")]
                            let taskbar_mismatch = taskbar::win::is_current_playing() != is_playing;
                            #[cfg(not(target_os = "windows"))]
                            let taskbar_mismatch = false;

                            if state_changed || taskbar_mismatch {
                                discord_c.update(state.clone());
                                if let Ok(lock) = smtc_c.lock() {
                                    if let Some(ref s) = *lock {
                                        s.update(&state);
                                    }
                                }
                                #[cfg(target_os = "windows")]
                                {
                                    if let Ok(lock) = taskbar_c.lock() {
                                        if let Some(ref tb) = *lock {
                                            tb.update_play_state(state.is_playing);
                                        }
                                    }
                                }
                            }
                        },
                    );
                }
            });

            // Check for updates in the background (runs after 5 seconds)
            updater::check_updates_background(handle);

            info!("Enix Music initialized successfully!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running enix music");
}
