// Enix Music - Native Audio / Video Switcher Controller
(function () {
  'use strict';

  if (window.__enix_av_switcher_loaded) return;
  window.__enix_av_switcher_loaded = true;

  console.info('[Enix Music] Initializing Native Audio / Video Switcher...');

  function getSavedMode() {
    return localStorage.getItem('enix_av_mode') === 'video' ? 'video' : 'song';
  }

  let currentMode = getSavedMode();

  // Apply visual display mode on ytmusic-player
  function applyModeToPlayer(mode) {
    const player = document.querySelector('ytmusic-player');
    const playerPage = document.querySelector('ytmusic-player-page');

    if (player) {
      player.setAttribute('enix-mode', mode);
    }
    if (playerPage) {
      playerPage.setAttribute('enix-mode', mode);
    }

    ensurePlayerCover();
  }

  // Ensure our dedicated cover artwork layer exists inside ytmusic-player
  function ensurePlayerCover() {
    const player = document.querySelector('ytmusic-player');
    if (!player) return;

    let cover = document.getElementById('enix-player-cover');
    if (!cover) {
      cover = document.createElement('div');
      cover.id = 'enix-player-cover';

      const img = document.createElement('img');
      img.id = 'enix-player-cover-img';
      img.alt = 'Album Artwork';

      cover.appendChild(img);
      player.appendChild(cover);
    }

    updatePlayerCoverImage();
  }

  // Update album artwork image source from best available metadata
  function updatePlayerCoverImage() {
    const img = document.getElementById('enix-player-cover-img');
    if (!img) return;

    let highResArt = '';
    try {
      const artwork = navigator.mediaSession?.metadata?.artwork;
      if (artwork && artwork.length > 0) {
        highResArt = artwork[artwork.length - 1]?.src || artwork[0]?.src || '';
      }
    } catch (_) {}

    if (!highResArt) {
      const barImg = document.querySelector(
        'ytmusic-player-bar ytmusic-thumbnail img, .middle-controls ytmusic-thumbnail img, #thumbnail img'
      );
      if (barImg && barImg.src && !barImg.src.startsWith('data:')) {
        highResArt = barImg.src.replace(/=w\d+-h\d+.*$/, '=w800-h800-l90-rj');
      }
    }

    if (highResArt && img.src !== highResArt) {
      img.src = highResArt;
    }
  }

  function setMode(newMode, shouldTriggerNative = true) {
    currentMode = newMode;
    localStorage.setItem('enix_av_mode', currentMode);

    const isVideo = currentMode === 'video';
    const isAudioOnly = !isVideo;
    localStorage.setItem('enix_audio_only_default', isAudioOnly.toString());

    applyModeToPlayer(currentMode);

    // Sync switch in Settings modal if present
    const switchInput = document.getElementById('enix-switch-enix_audio_only_default');
    if (switchInput) {
      switchInput.checked = isAudioOnly;
    }

    // Update pill buttons state
    const avToggle = document.querySelector('ytmusic-player-page ytmusic-av-toggle, ytmusic-av-toggle');
    if (avToggle) {
      const songBtn = avToggle.querySelector('#song-button, .song-button');
      const videoBtn = avToggle.querySelector('#video-button, .video-button');

      if (songBtn && videoBtn) {
        if (isVideo) {
          songBtn.classList.remove('active');
          songBtn.removeAttribute('aria-pressed');
          videoBtn.classList.add('active');
          videoBtn.setAttribute('aria-pressed', 'true');
        } else {
          songBtn.classList.add('active');
          songBtn.setAttribute('aria-pressed', 'true');
          videoBtn.classList.remove('active');
          videoBtn.removeAttribute('aria-pressed');
        }
      }

      if (shouldTriggerNative) {
        if (isVideo && videoBtn && !videoBtn.hasAttribute('disabled')) {
          videoBtn.click();
        } else if (!isVideo && songBtn && !songBtn.hasAttribute('disabled')) {
          songBtn.click();
        }
      }
    }

    window.dispatchEvent(
      new CustomEvent('enix:av-mode-changed', { detail: { isVideoMode: isVideo } })
    );
  }

  // Hook clicks on the native ytmusic-av-toggle buttons
  function bindToggleButtons() {
    const playerPage = document.querySelector('ytmusic-player-page#player-page, ytmusic-player-page');
    if (!playerPage) return;

    if (!playerPage.hasAttribute('has-av-switcher')) {
      playerPage.setAttribute('has-av-switcher', '');
    }

    const avToggle = playerPage.querySelector('ytmusic-av-toggle');
    if (!avToggle) return;

    const songBtn = avToggle.querySelector('#song-button, .song-button');
    const videoBtn = avToggle.querySelector('#video-button, .video-button');

    if (songBtn && !songBtn.__enix_hooked) {
      songBtn.__enix_hooked = true;
      songBtn.addEventListener('click', () => {
        setMode('song', false);
      }, true);
    }

    if (videoBtn && !videoBtn.__enix_hooked) {
      videoBtn.__enix_hooked = true;
      videoBtn.addEventListener('click', () => {
        if (!videoBtn.hasAttribute('disabled')) {
          setMode('video', false);
        }
      }, true);
    }

    // Keep active visual state aligned
    if (currentMode === 'video') {
      if (songBtn) songBtn.classList.remove('active');
      if (videoBtn) videoBtn.classList.add('active');
    } else {
      if (songBtn) songBtn.classList.add('active');
      if (videoBtn) videoBtn.classList.remove('active');
    }

    applyModeToPlayer(currentMode);
  }

  // Global methods
  window.enixToggleVideoMode = function (forceVideo) {
    const targetMode = forceVideo !== undefined ? (forceVideo ? 'video' : 'song') : (currentMode === 'video' ? 'song' : 'video');
    setMode(targetMode, true);
    return targetMode === 'video';
  };

  window.enixIsVideoMode = function () {
    return currentMode === 'video';
  };

  window.enixSetAVMode = function (mode) {
    setMode(mode, true);
  };

  // Run initialization and continuous monitor
  bindToggleButtons();
  setInterval(bindToggleButtons, 600);
  setInterval(ensurePlayerCover, 500);

  // Monitor song changes to keep album cover artwork updated
  let lastSong = '';
  setInterval(() => {
    const titleEl = document.querySelector('.title.ytmusic-player-bar');
    const title = titleEl ? titleEl.textContent : '';
    if (title && title !== lastSong) {
      lastSong = title;
      setTimeout(() => {
        applyModeToPlayer(currentMode);
        updatePlayerCoverImage();
      }, 300);
    }
  }, 800);
})();
