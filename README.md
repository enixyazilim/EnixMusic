<div align="center">
  <img src="src/assets/icons/enixmusic.png" width="128" height="128" alt="Enix Music Logo" />
  <h1>Enix Music</h1>
  <p><b>A modern, feature-packed, and lightweight desktop client for YouTube Music.</b></p>
  <p>Built with <b>Electron</b>, <b>Vue 3</b>, <b>Vite</b>, and <b>TypeScript</b>.</p>

  <p>
    <a href="#-disclaimer--yasal-uyarı">Disclaimer</a> •
    <a href="#-features--özellikler">Features</a> •
    <a href="#-download--installation">Download</a> •
    <a href="#-development--building">Development</a> •
    <a href="#-credits--acknowledgements">Credits</a> •
    <a href="#-license">License</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows" alt="Platform Windows" />
    <img src="https://img.shields.io/badge/Electron-v40-47848F?style=flat-square&logo=electron" alt="Electron" />
    <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/github/v/release/enixyazilim/EnixMusic?style=flat-square&color=blue" alt="Latest Release" />
    <img src="https://img.shields.io/badge/License-GPL--3.0-green?style=flat-square" alt="License" />
  </p>
</div>

---

> [!IMPORTANT]
> ### ⚠️ Disclaimer & Trademark Notice / Yasal Uyarı
>
> **No Affiliation**  
> Enix Music is an independent, community-driven, non-profit, and unofficial desktop client. This project and its contributors are **NOT** affiliated with, authorized by, endorsed by, maintained by, or in any way officially connected with **Google LLC**, **YouTube**, or any of their subsidiaries or affiliates.
>
> **Trademarks & Copyrights**  
> The names **"Google"**, **"YouTube"**, and **"YouTube Music"**, as well as associated marks, emblems, icons, and trade dress, are registered trademarks of Google LLC. Any use of these trademarks and brand assets in this project is strictly for identification, description, and nominative reference purposes only, and does not imply any sponsorship, endorsement, or commercial association with the trademark holder. We have no intention of infringing upon any intellectual property rights.
>
> **Limitation of Liability**  
> This software is provided *"AS IS"*, without warranty of any kind, express or implied. In no event shall the authors, developers, or contributors be held liable for any claim, damages, or other liability arising from, out of, or in connection with the software or the use of the software. The user assumes full responsibility for the use of this software.
>
> *(Türkçe: Enix Music bağımsız ve resmi olmayan bir açık kaynak masaüstü istemcisidir. Google LLC veya YouTube ile hiçbir resmi bağı, ortaklığı ya da onayı bulunmamaktadır. YouTube ve YouTube Music, Google LLC'nin tescilli ticari markalarıdır. Yazılım "olduğu gibi" sunulmakta olup tüm kullanım sorumluluğu son kullanıcıya aittir.)*

---

## 🌟 Features / Özellikler

### 🎵 Pure Audio & Resource Savings
- **Audio-Only Mode (Sadece Müzik Dinleme):**
  - Suppresses heavy video stream rendering and requests YouTube Music's native audio-only stream (`ATV_PREFERRED`).
  - Hides video decoders and displays high-resolution album artwork.
  - **Drastically reduces network bandwidth, monthly data consumption, and GPU/CPU hardware utilization.**
  - Persists automatically across track changes and playlist navigations.

### 🎛️ Native Windows Taskbar & System Controls
- **Windows Taskbar Thumbnail Controls (ThumbarButtons):**
  - Full Play/Pause, Next Track, and Previous Track controls directly accessible from the Windows taskbar DWM preview.
  - Controls remain responsive and active even when the application is minimized or hidden to the system tray.
  - Real-time synchronization with native HTML5 media events for instant thumbnail state updates.
- **Global Multimedia Shortcuts:**
  - Control playback anywhere from your OS using customizable keyboard shortcuts and hardware media keys (`MediaPlayPause`, `MediaNextTrack`, etc.).
- **Desktop Notifications:**
  - Rich native Windows notifications on song transitions displaying the track title, artist, and album artwork.

### 🧠 Smart Playback Enhancements
- **Auto "Keep Playing / You Still There?" Confirmation:**
  - Automatically dismisses YouTube Music's inactivity dialogs, ensuring uninterrupted all-day background playback.
- **Skip Disliked Songs (Beğenilmeyenleri Otomatik Atla):**
  - Automatically skips to the next track if a song is disliked or was previously marked with a dislike.
- **Mouse Wheel Volume Control (Fare Tekerleği ile Ses Denetimi):**
  - Adjust volume with high precision (±5% increments) simply by scrolling your mouse wheel over the bottom player bar or player canvas.
- **Silence Skipping (Sessizlik Atlama):**
  - Employs the Web Audio Analyser API to monitor audio frequency levels in real-time, swiftly skipping through prolonged silent intros, outros, or mid-song gaps (>300ms).

### 🛡️ Smart Ad-Blocking & Privacy
- **Built-in Ad-Blocker:**
  - High-performance network and DOM-level ad-blocking powered by Ghostery Adblocker engine, eliminating video and audio ads without interruptions.
- **Auto-Updater Integration:**
  - Background update checks against GitHub Releases via `electron-updater` with seamless one-click installations.

### 🎮 Integrations & Remote Control
- **Discord Rich Presence (RPC):**
  - Displays your currently playing song, artist, album art, elapsed time, and total duration live on your Discord profile.
- **Local Companion Remote Server:**
  - Built-in secure local API (`Fastify` + `Socket.io`) allowing control of playback, volume, queue, and tracks from other devices or custom integrations on your local network.

### 🎨 Personalization & Multi-Language (i18n)
- **Multi-Channel Audio (5.1 / 7.1 Speaker Fill):**
  - Expands stereo tracks across surround sound speakers in 5.1 or 7.1 multi-channel audio setups.
- **Custom CSS Theming:**
  - Load your own CSS stylesheets to completely personalize the interface appearance.
- **Turkish & English Localization:**
  - Full English and Turkish interface with automatic system language detection and manual switching.

---

## 📥 Download & Installation / İndirme ve Kurulum

Get the latest installer directly from the Releases page:

<p align="left">
  <a href="https://github.com/enixyazilim/EnixMusic/releases/latest">
    <img src="https://img.shields.io/badge/Download_Latest_Release-Windows_(64--bit)-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Download for Windows" />
  </a>
</p>

- Download and launch the setup installer (`.exe`).
- Follow the on-screen installation wizard.
- The built-in auto-updater will keep your application seamlessly up to date with future releases.

---

## 🛠️ Development & Building / Geliştirme ve Derleme

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v22+ recommended)
- [pnpm](https://pnpm.io/) (v9.x or higher)

### Setup & Run
```bash
# 1. Clone the repository
git clone https://github.com/enixyazilim/EnixMusic.git

# 2. Enter directory
cd EnixMusic

# 3. Install dependencies
pnpm install

# 4. Start in development mode
pnpm dev
```

### Production Build & Packaging
```bash
# Run linter and type checks
pnpm lint

# Compile and build application bundles (Vite SSR + Renderer)
pnpm build

# Generate Windows installer (.exe setup package in dist/)
pnpm dist
```

---

## 💖 Credits & Acknowledgements / Teşekkürler

Enix Music is built upon the collective knowledge and inspiration of the open-source community:

- **[YTMDesktop (YouTube Music Desktop App)](https://github.com/ytmdesktop/ytmdesktop):** Foundational architecture and desktop client inspiration.
- **[pear-desktop](https://github.com/pear-devs/pear-desktop):** Inspiration for audio-only stream toggling, silence skipping, and precise volume control implementations.
- **Enix Yazılım Enhancements:** Re-architected with modern Vue 3 + Vite, native Electron 40 engine, clean declarative shortcut dispatchers, zero-error ESLint hygiene, enhanced taskbar synchronization, and English/Turkish bilingual design.

---

## 📜 License / Lisans

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).  
Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications under the same license.
