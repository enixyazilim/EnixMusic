use crate::state::TrackState;
use log::{debug, info};
use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use souvlaki::{MediaControlEvent, MediaControls, MediaMetadata, MediaPlayback, MediaPosition, PlatformConfig};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Manager, WebviewWindow};

pub struct SmtcService {
    controls: Arc<Mutex<Option<MediaControls>>>,
}

impl SmtcService {
    pub fn new(app_handle: AppHandle, window: &WebviewWindow) -> Self {
        #[cfg(target_os = "windows")]
        let hwnd = match window.window_handle() {
            Ok(handle) => match handle.as_raw() {
                RawWindowHandle::Win32(h) => Some(h.hwnd.get() as *mut std::ffi::c_void),
                _ => None,
            },
            Err(_) => None,
        };

        #[cfg(not(target_os = "windows"))]
        let hwnd = None;

        let config = PlatformConfig {
            dbus_name: "enix_music",
            display_name: "Enix Music",
            hwnd,
        };

        let controls = match MediaControls::new(config) {
            Ok(mut ctrl) => {
                let handle = app_handle.clone();
                let attach_res = ctrl.attach(move |event: MediaControlEvent| {
                    if let Some(win) = handle.get_webview_window("main") {
                        match event {
                            MediaControlEvent::Play => {
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.play()");
                            }
                            MediaControlEvent::Pause => {
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.pause()");
                            }
                            MediaControlEvent::Toggle => {
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.togglePlay()");
                            }
                            MediaControlEvent::Next => {
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.next()");
                            }
                            MediaControlEvent::Previous => {
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.previous()");
                            }
                            _ => {}
                        }
                    }
                });

                if let Err(e) = attach_res {
                    debug!("Failed to attach SMTC event handler: {:?}", e);
                } else {
                    info!("Windows SMTC media controls initialized!");
                }
                Some(ctrl)
            }
            Err(e) => {
                debug!("Failed to create SMTC controls: {:?}", e);
                None
            }
        };

        Self {
            controls: Arc::new(Mutex::new(controls)),
        }
    }

    pub fn update(&self, state: &TrackState) {
        if let Ok(mut lock) = self.controls.lock() {
            if let Some(ref mut ctrl) = *lock {
                let duration = if state.duration > 0.0 {
                    Some(Duration::from_secs_f64(state.duration))
                } else {
                    None
                };

                let cover_url = if state.album_art.is_empty() {
                    None
                } else {
                    Some(state.album_art.as_str())
                };

                let _ = ctrl.set_metadata(MediaMetadata {
                    title: Some(state.title.as_str()),
                    artist: Some(state.artist.as_str()),
                    album: Some(state.album.as_str()),
                    cover_url,
                    duration,
                });

                let progress = if state.progress > 0.0 {
                    Some(MediaPosition(Duration::from_secs_f64(state.progress)))
                } else {
                    None
                };

                let playback = if state.is_playing {
                    MediaPlayback::Playing { progress }
                } else {
                    MediaPlayback::Paused { progress }
                };

                let _ = ctrl.set_playback(playback);
            }
        }
    }
}
