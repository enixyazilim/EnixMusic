// Enix Music - Injected Player Bridge & Real-Time IPC to Tauri Rust
(function () {
  'use strict';

  if (window.__enix_player_bridge_loaded) return;
  window.__enix_player_bridge_loaded = true;

  console.info('[Enix Music] Initializing Player Bridge & Rust IPC...');

  let lastTrackState = {
    title: '',
    artist: '',
    album: '',
    album_art: '',
    duration: 0,
    progress: 0,
    is_playing: false,
    is_video_mode: false,
    volume: 1,
    is_muted: false
  };

  // Modern YTM can swap video elements during song transitions (old paused vs new playing).
  // Always select the video that is actually active or playing.
  function getActiveVideo() {
    const all = Array.from(document.querySelectorAll('video'));
    return (
      all.find((v) => !v.paused && v.readyState >= 2 && v.duration > 0) ||
      all.find((v) => !v.paused) ||
      all.find((v) => v.readyState >= 2 && v.duration > 0) ||
      all[0] ||
      null
    );
  }

  function getHighResThumbnail() {
    try {
      const artwork = navigator.mediaSession?.metadata?.artwork;
      if (artwork && artwork.length > 0) {
        const src = artwork[artwork.length - 1]?.src || artwork[0]?.src;
        if (src) return src;
      }
    } catch (_) {}

    const thumbImg =
      document.querySelector('ytmusic-player #thumbnail img') ||
      document.querySelector('ytmusic-player-bar ytmusic-thumbnail img') ||
      document.querySelector('.thumbnail-image-wrapper img');
    if (thumbImg && thumbImg.src && !thumbImg.src.startsWith('data:')) {
      return thumbImg.src.replace(/=w\d+-h\d+.*$/, '=w800-h800-l90-rj');
    }

    return '';
  }

  function isPlayerPlaying(video) {
    // 1. YouTube Music Player API
    try {
      const playerBar = document.querySelector('ytmusic-app-layout>ytmusic-player-bar, ytmusic-player-bar');
      if (playerBar && playerBar.playerApi && typeof playerBar.playerApi.getPlayerState === 'function') {
        const pState = playerBar.playerApi.getPlayerState();
        if (pState === 1) return true;
        if (pState === 2 || pState === 0) return false;
      }
    } catch (_) {}

    // 2. Play/Pause button in bottom player bar
    try {
      const playBtn = document.querySelector('#play-pause-button, tp-yt-paper-icon-button#play-pause-button, button#play-pause-button');
      if (playBtn) {
        const label = (
          playBtn.getAttribute('aria-label') ||
          playBtn.getAttribute('title') ||
          playBtn.querySelector('button')?.getAttribute('aria-label') ||
          playBtn.querySelector('button')?.getAttribute('title') ||
          ''
        ).toLowerCase();
        if (label.includes('duraklat') || label.includes('pause')) return true;
        if (label.includes('oynat') || label.includes('play')) return false;

        const iconEl = playBtn.querySelector('iron-icon, tp-yt-iron-icon');
        const iconAttr = (iconEl?.getAttribute('icon') || '').toLowerCase();
        if (iconAttr.includes('pause')) return true;
        if (iconAttr.includes('play')) return false;
      }
    } catch (_) {}

    // 3. MediaSession playbackState
    try {
      if (navigator.mediaSession && navigator.mediaSession.playbackState) {
        if (navigator.mediaSession.playbackState === 'playing') return true;
        if (navigator.mediaSession.playbackState === 'paused') return false;
      }
    } catch (_) {}

    // 4. HTML5 Video element
    if (video) {
      return !video.paused && !video.ended;
    }

    // 5. Fallback: check any active video in document
    const anyPlaying = Array.from(document.querySelectorAll('video')).some(
      (v) => !v.paused && !v.ended
    );
    if (anyPlaying) return true;

    return false;
  }

  function getPlayerMetadata() {
    const video = getActiveVideo();
    const titleEl = document.querySelector('.title.ytmusic-player-bar');
    const subtitleEl =
      document.querySelector('.subtitle.ytmusic-player-bar') ||
      document.querySelector('.byline.ytmusic-player-bar');

    let title = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent || '').trim() : '';
    let artist = '';
    let album = '';

    if (subtitleEl) {
      const text = (subtitleEl.textContent || '').trim();
      const parts = text.split('•').map((p) => p.trim());
      if (parts.length > 0) artist = parts[0];
      if (parts.length > 1) album = parts[1];
    }

    // Fallback to MediaSession if DOM is still rendering
    if (!title && navigator.mediaSession && navigator.mediaSession.metadata) {
      title = navigator.mediaSession.metadata.title || '';
      if (!artist) artist = navigator.mediaSession.metadata.artist || '';
      if (!album) album = navigator.mediaSession.metadata.album || '';
    }

    // Ensure numeric fields are finite numbers (JSON does not support NaN or Infinity)
    const rawDur = video?.duration;
    const rawCur = video?.currentTime;
    const duration = typeof rawDur === 'number' && Number.isFinite(rawDur) ? rawDur : 0;
    const progress = typeof rawCur === 'number' && Number.isFinite(rawCur) ? rawCur : 0;

    const is_playing = isPlayerPlaying(video);
    const volume = video && typeof video.volume === 'number' ? video.volume : 1;
    const is_muted = video ? Boolean(video.muted) : false;
    const is_video_mode = typeof window.enixIsVideoMode === 'function' ? window.enixIsVideoMode() : false;
    const album_art = getHighResThumbnail();

    const hide_to_tray = localStorage.getItem('enix_hide_to_tray') !== null
      ? localStorage.getItem('enix_hide_to_tray') === 'true'
      : true;
    const autostart = localStorage.getItem('enix_autostart') !== null
      ? localStorage.getItem('enix_autostart') === 'true'
      : false;

    return {
      title,
      artist,
      album,
      album_art,
      duration,
      progress,
      is_playing,
      is_video_mode,
      volume,
      is_muted,
      hide_to_tray,
      autostart
    };
  }

  function emitStateToRust(force = false) {
    const current = getPlayerMetadata();

    const hasChanged =
      force ||
      current.title !== lastTrackState.title ||
      current.artist !== lastTrackState.artist ||
      current.is_playing !== lastTrackState.is_playing ||
      current.is_video_mode !== lastTrackState.is_video_mode ||
      current.hide_to_tray !== lastTrackState.hide_to_tray ||
      current.autostart !== lastTrackState.autostart ||
      Math.abs(current.progress - lastTrackState.progress) >= 1;

    if (!hasChanged) return;
    lastTrackState = current;

    try {
      if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
        window.__TAURI_INTERNALS__.invoke('plugin:event|emit', {
          event: 'enix-state',
          payload: current
        }).catch((err) => {
          console.debug('[Enix IPC Error]:', err);
        });
      }
    } catch (_) {}
  }

  // Define player control helper methods
  const enixPlayer = {
    play: () => {
      const btn = document.querySelector('#play-pause-button button, #play-pause-button');
      if (btn) btn.click();
      const v = getActiveVideo();
      if (v && v.paused) v.play().catch(() => {});
    },
    pause: () => {
      const btn = document.querySelector('#play-pause-button button, #play-pause-button');
      if (btn) btn.click();
      const v = getActiveVideo();
      if (v && !v.paused) v.pause();
    },
    togglePlay: () => {
      const btn = document.querySelector('#play-pause-button button, #play-pause-button');
      if (btn) {
        btn.click();
      } else {
        const v = getActiveVideo();
        if (v) {
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        }
      }
      setTimeout(() => emitStateToRust(true), 100);
    },
    next: () => {
      const btn = document.querySelector('.next-button.ytmusic-player-bar button, .next-button.ytmusic-player-bar, #next-button');
      if (btn) btn.click();
      setTimeout(() => emitStateToRust(true), 300);
    },
    previous: () => {
      const btn = document.querySelector('.previous-button.ytmusic-player-bar button, .previous-button.ytmusic-player-bar, #previous-button');
      if (btn) btn.click();
      setTimeout(() => emitStateToRust(true), 300);
    },
    seek: (timeSeconds) => {
      const player = document.querySelector('ytmusic-player');
      if (player && player.playerApi && typeof player.playerApi.seekTo === 'function') {
        player.playerApi.seekTo(timeSeconds, true);
        return;
      }
      const v = getActiveVideo();
      if (v) v.currentTime = timeSeconds;
    },
    setVolume: (val) => {
      const v = getActiveVideo();
      if (v) v.volume = Math.max(0, Math.min(1, val));
    },
    toggleVideoMode: () => {
      if (typeof window.enixToggleVideoMode === 'function') {
        window.enixToggleVideoMode();
      }
    },
    toggleAudioPanel: () => {
      if (typeof window.enixToggleAudioPanel === 'function') {
        window.enixToggleAudioPanel();
      }
    },
    openSettings: (tab) => {
      if (typeof window.enixOpenSettings === 'function') {
        window.enixOpenSettings(tab);
      }
    }
  };

  window.enixPlayer = enixPlayer;
  window.__enix__ = enixPlayer;
  window.enixGetState = getPlayerMetadata;

  // Poll state every 300ms for ultra-responsive Taskbar & SMTC updates
  setInterval(() => emitStateToRust(false), 300);

  // Hook directly to HTML5 video events
  function hookVideoEvents() {
    const video = getActiveVideo();
    if (!video || video.__enix_hooked) return;
    video.__enix_hooked = true;

    ['play', 'playing', 'pause', 'ended', 'timeupdate', 'volumechange'].forEach((ev) => {
      video.addEventListener(ev, () => emitStateToRust(true));
    });
  }

  setInterval(hookVideoEvents, 1000);
})();
