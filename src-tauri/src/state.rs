use serde::{Deserialize, Serialize};
use std::sync::{atomic::AtomicBool, Arc, Mutex};

#[derive(Default, Clone, Serialize, Deserialize, Debug)]
pub struct TrackState {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub album_art: String,
    pub duration: f64,
    pub progress: f64,
    pub is_playing: bool,
    pub is_video_mode: bool,
    pub volume: f64,
    pub is_muted: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppConfig {
    pub hide_to_tray: bool,
    pub autostart: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            hide_to_tray: true,
            autostart: false,
        }
    }
}

pub fn get_config_path() -> std::path::PathBuf {
    let base = std::env::var("APPDATA")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    base.join("com.enixyazilim.enixmusic").join("config.json")
}

pub fn load_app_config() -> AppConfig {
    let path = get_config_path();
    if let Ok(data) = std::fs::read_to_string(&path) {
        if let Ok(cfg) = serde_json::from_str::<AppConfig>(&data) {
            log::info!("Loaded config from disk: hide_to_tray={}, autostart={}", cfg.hide_to_tray, cfg.autostart);
            return cfg;
        }
    }
    AppConfig::default()
}

pub fn save_app_config(cfg: &AppConfig) {
    let path = get_config_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string_pretty(cfg) {
        let _ = std::fs::write(&path, json);
    }
}

#[derive(Clone)]
pub struct AppState {
    pub track: Arc<Mutex<TrackState>>,
    pub hide_to_tray: Arc<AtomicBool>,
}

impl AppState {
    pub fn new() -> Self {
        let cfg = load_app_config();
        Self {
            track: Arc::new(Mutex::new(TrackState::default())),
            hide_to_tray: Arc::new(AtomicBool::new(cfg.hide_to_tray)),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
