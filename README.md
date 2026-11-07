<div align="center">
  <img src="assets/icons/enixmusic.png" width="128" height="128" alt="Enix Music Logo" />
  <h1>Enix Music</h1>
  <p><b>A modern, ultra-lightweight, and high-performance desktop client for YouTube Music.</b></p>
  <p>Rebuilt from scratch with <b>100% Pure Rust</b> and <b>Tauri v2</b> (Zero Node.js / Zero npm).</p>

  <p>
    <a href="#-features--özellikler">Features</a> •
    <a href="#-architecture--mimari">Architecture</a> •
    <a href="#-development--building">Development</a> •
    <a href="#-license">License</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows" alt="Platform Windows" />
    <img src="https://img.shields.io/badge/Rust-v1.90+-DEA584?style=flat-square&logo=rust" alt="Rust" />
    <img src="https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri" alt="Tauri v2" />
    <img src="https://img.shields.io/badge/Node.js-Eliminated-success?style=flat-square" alt="No Node.js" />
    <img src="https://img.shields.io/badge/License-GPL--3.0-green?style=flat-square" alt="License" />
  </p>
</div>

---

> [!NOTE]
> **Legacy Electron Archive**  
> The previous Electron / Node.js version (v0.2.1) has been safely archived to the [`archive/electron`](https://github.com/enixyazilim/EnixMusic/tree/archive/electron) branch and tagged as `v0.2.1-electron`.

---

## 🌟 Features / Özellikler

### ⚡ Ultra-Lightweight & Extreme Efficiency (Saf Rust)
- **100% Pure Rust:** No Node.js, npm, or pnpm runtime dependencies.
- **Native WebView2 Integration:** Powered by Rust and Tauri v2. No heavy bundled Chromium (~350MB+ RAM reduced down to ~35-50MB RAM).
- **Fast Startup:** Native 12.5 MB executable with minimal CPU overhead.

### 🎵 Mobile-Style Song / Video Mode (Sadece Müzik veya Video)
- **Seamless AV Switcher:** Same experience as YouTube Music mobile app.
- **Pure Audio Mode (`ATV_PREFERRED`):** Requests native audio stream, turns off video decoders, saves GPU/CPU resources and network bandwidth, while displaying high-resolution album artwork.
- **Video Clip Mode (`OMV_PREFERRED`):** Instant switch to official music video with one click.

### 🎚️ Advanced Spotify-Like Audio (Gelişmiş Ses)
- **Loudness Normalization:** Built-in Web Audio `DynamicsCompressorNode` normalizes volume between overly loud and quiet tracks automatically.
- **Equalizer Presets:** 3-band parametric equalizer featuring presets:
  - *Bass Booster* (+8 dB bass)
  - *Vokal Netleştirici (Vocal Boost)*
  - *Tiz Artırıcı (Treble Boost)*
  - *Düz (Flat)*
  - *Gece Modu (Night Mode / Compressed)*
- **Precise Mouse Wheel Volume:** Smooth volume adjustments (±4%) directly over the player bar.

### 🛡️ Smart Ad-Blocking & Auto-Skip
- **Pre-player Scriptlet Trap:** Intercepts `ytInitialPlayerResponse` and eliminates `playerAds` / `adPlacements` before the player even initializes (uBlock Origin method).
- **Video Ad Fast-Forward:** Instantly skips past any sponsored breaks.
- **Cosmetic Cleaner:** Hides YouTube Premium upgrade banners, promo bars, and "Are you still watching?" popups.

### 🎮 Native Windows & Discord Integrations
- **Windows Taskbar Thumbnail Controls (ThumbarButtons):** Play/Pause, Next, and Previous controls directly on Windows taskbar live preview.
- **Windows SMTC (System Media Transport Controls):** Native Windows 10/11 volume flyouts, hardware media keys (`MediaPlayPause`, `MediaNextTrack`), and lock screen integration via pure Rust.
- **Discord Rich Presence (RPC):** Shows current playing track, artist name, album art, elapsed and total duration with zero latency.
- **System Tray:** Background minimize, quick controls, and song info.

---

## 🛠️ Architecture / Mimari

```
EnixMusic/
├── Cargo.toml               # Pure Rust Workspace
├── Cargo.lock
├── assets/                  # High-resolution logos & icons
├── injected/                # Injected JavaScript modules for YouTube Music
│   ├── adblocker.js         # Anti-adblock trap & auto-skipper
│   ├── av_switcher.js       # Mobile-style Song / Video switcher
│   ├── audio_effects.js     # Spotify-style loudness normalization & EQ
│   ├── player_bridge.js     # Track state monitor & IPC bridge
│   ├── styles.css           # Polished UI switcher & player styles
│   └── bundle.js            # Auto-compiled by Rust build.rs
├── ui/                      # Minimal static shell
└── src-tauri/               # Rust Core (Tauri v2)
    ├── build.rs             # Automatic native script bundler & Tauri builder
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/        # Tauri v2 permission matrix
    └── src/
        ├── main.rs          # Application entry point
        ├── lib.rs           # Tauri lifecycle, webview setup, IPC handlers
        ├── state.rs         # Shared track & application state
        ├── discord.rs       # Native Discord Rich Presence IPC
        ├── smtc.rs          # Windows SMTC & multimedia keys
        ├── taskbar.rs       # Windows Taskbar ThumbarButtons
        └── tray.rs          # System tray controls
```

---

## 🚀 Development & Building / Geliştirme

Tüm proje saf Rust araç takımı (`cargo`) ile geliştirilebilir ve derlenebilir. **Hiçbir Node.js veya npm kurulumuna ihtiyaç yoktur.**

### Gereksinimler
- [Rust](https://www.rust-lang.org/) (1.90+)
- Windows 10/11

### Geliştirme Modunda Çalıştırma
```bash
cargo run
```

### Optimize Sürüm (Release) Derleme
```bash
cargo build --release
```
Derlenen tek parça bağımsız çalıştırılabilir dosya (`.exe`):
`target/release/enix-music.exe` (yaklaşık 12.5 MB).

---

## 📜 License
GPL-3.0-only © Enix Yazılım
