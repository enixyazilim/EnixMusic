<div align="center">
  <img src="src/assets/icons/enixmusic.png" width="128" height="128" alt="Enix Music Logo" />
  <h1>Enix Music</h1>
  <p><b>A modern, feature-packed, and lightweight desktop client for YouTube Music.</b></p>
  <p>Built with <b>Electron</b>, <b>Vue 3</b>, <b>Vite</b>, and <b>TypeScript</b>.</p>

  <p>
    <a href="#features">Features</a> •
    <a href="#installation--development">Installation</a> •
    <a href="#building">Building</a> •
    <a href="#credits">Credits</a> •
    <a href="#disclaimer">Disclaimer</a> •
    <a href="#license">License</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows" alt="Platform Windows" />
    <img src="https://img.shields.io/badge/Electron-v40-47848F?style=flat-square&logo=electron" alt="Electron" />
    <img src="https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square" alt="License" />
  </p>
</div>

---

## 🌟 Key Features / Özellikler

### 🛡️ Smart Ad-Blocking & Auto-Skip
- **Zero Distractions:** Network-level ad filtering combined with smart DOM-level sponsor and in-stream ad skipping.
- **Auto "Keep Playing" Confirmation:** Automatically dismisses YouTube Music's inactivity pop-up dialog (*"Are you still watching/listening?"*) so your music plays continuously without interruption.

### 🎮 Discord Rich Presence (RPC)
- Real-time status display on Discord showing the song title, artist, album art, playback status, and elapsed/remaining duration.

### 🎛️ Native Media Controls & Taskbar Integration
- **Windows Taskbar Controls:** Control playback (Play/Pause, Next, Previous) directly from the Windows taskbar thumbnail preview.
- **Global Keybinds & Media Keys:** Full support for hardware multimedia keyboard keys and customizable global shortcuts.
- **Desktop Notifications:** Native notifications on song track transitions with song metadata and artwork.

### 📱 Remote Companion Server
- Built-in local HTTP & WebSocket server (`Fastify` + `Socket.io`) allowing you to securely control music playback remotely from mobile devices on your local network.

### 🎨 Personalization & Audio Controls
- **Custom CSS Support:** Inject your own custom CSS stylesheets to personalize the player appearance.
- **Audio Enhancements:** Speaker Fill stereo expansion and volume ratio management.
- **Background Performance:** Seamless playback even when minimized, with Chromium timer throttling bypass.

---

## 🛠️ Installation & Development / Kurulum ve Geliştirme

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher, v22+ recommended)
- [pnpm](https://pnpm.io/) (v9 or higher)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/enixyazilim/EnixMusic.git

# 2. Enter the project directory
cd EnixMusic

# 3. Install dependencies
pnpm install

# 4. Start in development mode
pnpm dev
```

---

## 📦 Building for Production / Derleme

```bash
# Compile and build assets
pnpm build

# Generate Windows installer (.exe setup package)
pnpm dist
```

The installer executable will be generated inside the `dist/` directory.

---

## <a id="credits"></a>💖 Acknowledgements & Credits / Teşekkürler & Atıflar

- **[YTMDesktop (YouTube Music Desktop App)](https://github.com/ytmdesktop/ytmdesktop):** Enix Music is built upon and inspired by the foundational open-source work of the YTMDesktop project and its community contributors.
- **Enix Yazılım Enhancements:** Modernized with multi-language (EN/TR i18n) support, latest Electron & Chromium engine compatibility, custom elements recursion fixes, early UI injection performance, and custom branding.

---

## ⚖️ Disclaimer / Sorumluluk Reddi

> **EN:** Enix Music is an **unofficial, community-driven desktop client** and is **NOT** affiliated with, maintained, authorized, endorsed, or sponsored by Google LLC or YouTube. YouTube, YouTube Music, and the YouTube logo are registered trademarks of Google LLC.

> **TR:** Enix Music, topluluk odaklı **resmi olmayan** bir masaüstü istemcisidir. Google LLC veya YouTube ile hiçbir resmi bağı, sponsorluğu ya da onayı bulunmamaktadır. YouTube, YouTube Music ve YouTube logosu Google LLC'nin tescilli ticari markalarıdır.

---

## 📜 License / Lisans

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).
