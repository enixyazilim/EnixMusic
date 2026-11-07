use crate::state::TrackState;
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use log::{debug, info, warn};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const DISCORD_CLIENT_ID: &str = "1234041951318442025";

#[derive(Clone)]
pub struct DiscordService {
    sender: Sender<TrackState>,
}

impl DiscordService {
    pub fn new() -> Self {
        let (sender, receiver) = channel::<TrackState>();

        thread::spawn(move || {
            Self::worker_loop(receiver);
        });

        Self { sender }
    }

    pub fn update(&self, state: TrackState) {
        let _ = self.sender.send(state);
    }

    fn worker_loop(receiver: Receiver<TrackState>) {
        let mut client: Option<DiscordIpcClient> = None;
        let mut last_connect_attempt = SystemTime::now() - Duration::from_secs(60);
        let mut latest_state: Option<TrackState> = None;

        loop {
            // Drain receiver to always get the freshest state
            while let Ok(state) = receiver.try_recv() {
                latest_state = Some(state);
            }

            // Ensure Discord client is connected
            if client.is_none() {
                if last_connect_attempt.elapsed().unwrap_or(Duration::from_secs(0)) > Duration::from_secs(15) {
                    last_connect_attempt = SystemTime::now();
                    match DiscordIpcClient::new(DISCORD_CLIENT_ID) {
                        Ok(mut new_client) => {
                            if let Err(e) = new_client.connect() {
                                debug!("Discord not running or connect error: {}", e);
                            } else {
                                info!("Discord Rich Presence connected!");
                                client = Some(new_client);
                            }
                        }
                        Err(e) => {
                            debug!("Failed to initialize Discord client: {}", e);
                        }
                    }
                }
            }

            // If connected and we have a state to publish
            if let Some(ref mut ipc) = client {
                if let Some(ref state) = latest_state {
                    if state.title.is_empty() {
                        let _ = ipc.clear_activity();
                    } else {
                        let title = string_limit(&state.title, 128, 2);
                        let artist = string_limit(&state.artist, 128, 2);
                        let album = if state.album.is_empty() {
                            "Enix Music".to_string()
                        } else {
                            string_limit(&state.album, 128, 2)
                        };

                        let small_img = if state.is_playing { "play-border" } else { "pause-border" };
                        let small_txt = if state.is_playing { "Oynatılıyor" } else { "Duraklatıldı" };

                        let mut act = activity::Activity::new()
                            .details(&title)
                            .state(&artist);

                        // Large image
                        let large_img = if state.album_art.is_empty() {
                            "enixm-logo"
                        } else {
                            &state.album_art
                        };

                        let assets = activity::Assets::new()
                            .large_image(large_img)
                            .large_text(&album)
                            .small_image(small_img)
                            .small_text(small_txt);

                        act = act.assets(assets);

                        // Timestamps when playing
                        if state.is_playing && state.duration > 0.0 {
                            let now_secs = SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs() as i64;
                            let start = now_secs - state.progress as i64;
                            let end = start + state.duration as i64;

                            let timestamps = activity::Timestamps::new().start(start).end(end);
                            act = act.timestamps(timestamps);
                        }

                        // Button
                        let buttons = vec![activity::Button::new(
                            "Enix Music",
                            "https://github.com/enixyazilim/EnixMusic",
                        )];
                        act = act.buttons(buttons);

                        if let Err(e) = ipc.set_activity(act) {
                            warn!("Discord IPC set_activity failed, will reconnect: {}", e);
                            let _ = ipc.close();
                            client = None;
                        }
                    }
                }
            }

            // Wait for next update or interval tick
            match receiver.recv_timeout(Duration::from_millis(1500)) {
                Ok(state) => {
                    latest_state = Some(state);
                }
                Err(_) => {
                    // Timeout tick - continue loop to maintain connection / keepalive
                }
            }
        }
    }
}

fn string_limit(s: &str, max: usize, min: usize) -> String {
    let trimmed = s.trim();
    if trimmed.chars().count() > max {
        let mut res: String = trimmed.chars().take(max - 3).collect();
        res.push_str("...");
        res
    } else if trimmed.chars().count() < min {
        let mut res = trimmed.to_string();
        while res.chars().count() < min {
            res.push('\u{200B}'); // Zero-width space padding
        }
        res
    } else {
        trimmed.to_string()
    }
}
