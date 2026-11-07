use log::info;
use semver::Version;
use serde::Deserialize;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
#[cfg(not(target_os = "windows"))]
use tauri_plugin_notification::NotificationExt;

const GITHUB_REPO: &str = "enixyazilim/EnixMusic";
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Deserialize, Debug)]
struct GitHubRelease {
    tag_name: String,
    html_url: String,
    #[serde(default)]
    _body: Option<String>,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct UpdateInfo {
    pub current_version: String,
    pub latest_version: String,
    pub has_update: bool,
    pub release_url: String,
}

pub fn check_updates_background(app: AppHandle) {
    thread::spawn(move || {
        // Wait 5 seconds after startup so app initializes smoothly
        thread::sleep(Duration::from_secs(5));
        let _ = check_for_updates(&app, false);
    });
}

pub fn check_for_updates(_app: &AppHandle, notify_if_latest: bool) -> Result<UpdateInfo, String> {
    let url = format!("https://api.github.com/repos/{}/releases/latest", GITHUB_REPO);

    info!("Checking for updates from: {}", url);

    let resp = ureq::get(&url)
        .set("User-Agent", "EnixMusic-Desktop-Client")
        .timeout(Duration::from_secs(8))
        .call()
        .map_err(|e| format!("GitHub API bağlantı hatası: {}", e))?;

    let release: GitHubRelease = resp
        .into_json()
        .map_err(|e| format!("JSON çözümleme hatası: {}", e))?;

    let clean_remote = release.tag_name.trim_start_matches('v').trim();
    let clean_current = CURRENT_VERSION.trim_start_matches('v').trim();

    let remote_semver = Version::parse(clean_remote)
        .map_err(|e| format!("Uzak sürüm geçersiz semver: {}", e))?;
    let current_semver = Version::parse(clean_current)
        .map_err(|e| format!("Mevcut sürüm geçersiz semver: {}", e))?;

    let has_update = remote_semver > current_semver;

    let info = UpdateInfo {
        current_version: CURRENT_VERSION.to_string(),
        latest_version: release.tag_name.clone(),
        has_update,
        release_url: release.html_url.clone(),
    };

    if has_update {
        info!("New version available: {} (current: {})", release.tag_name, CURRENT_VERSION);
        #[cfg(target_os = "windows")]
        {
            let _ = notify_rust::Notification::new()
                .app_id("com.enixyazilim.enixmusic")
                .summary("Enix Music Güncellemesi Mevcut!")
                .body(&format!("Yeni sürüm ({}) yayınlandı. İndirmek için tıklayın.", release.tag_name))
                .show();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = app.notification()
                .builder()
                .title("Enix Music Güncellemesi Mevcut!")
                .body(format!("Yeni sürüm ({}) yayınlandı. İndirmek için tıklayın.", release.tag_name))
                .show();
        }
    } else if notify_if_latest {
        info!("Enix Music is up to date: {}", CURRENT_VERSION);
        #[cfg(target_os = "windows")]
        {
            let _ = notify_rust::Notification::new()
                .app_id("com.enixyazilim.enixmusic")
                .summary("Enix Music Güncel")
                .body(&format!("En son sürümü ({}) kullanıyorsunuz.", CURRENT_VERSION))
                .show();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = app.notification()
                .builder()
                .title("Enix Music Güncel")
                .body(format!("En son sürümü ({}) kullanıyorsunuz.", CURRENT_VERSION))
                .show();
        }
    }

    Ok(info)
}

pub fn open_release_page(url: &str) {
    let target = if url.is_empty() {
        format!("https://github.com/{}/releases/latest", GITHUB_REPO)
    } else {
        url.to_string()
    };

    let _ = open::that(target);
}
