// Enix Music - Ultra-Fast AdBlocker & Video Skipper (Trusted Types Safe)
(function () {
  'use strict';

  if (window.__enix_adblocker_loaded) return;
  window.__enix_adblocker_loaded = true;

  console.info('[Enix Music] Initializing Ultra-Fast AdBlocker...');

  // 1. JSON Player Response Sanitizer
  function cleanAdData(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    try {
      delete obj.playerAds;
      delete obj.adPlacements;
      delete obj.adSlots;
      if (obj.playerResponse) {
        delete obj.playerResponse.playerAds;
        delete obj.playerResponse.adPlacements;
        delete obj.playerResponse.adSlots;
      }
    } catch (_) {}
    return obj;
  }

  // Intercept fetch
  try {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const res = await originalFetch.apply(this, args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        if (url.includes('/youtubei/v1/player') || url.includes('/youtubei/v1/next')) {
          const clone = res.clone();
          const text = await clone.text();
          let json = JSON.parse(text);
          if (json.playerAds || json.adPlacements || json.adSlots || (json.playerResponse && (json.playerResponse.playerAds || json.playerResponse.adPlacements))) {
            json = cleanAdData(json);
            return new Response(JSON.stringify(json), {
              status: res.status,
              statusText: res.statusText,
              headers: res.headers
            });
          }
        }
      } catch (_) {}
      return res;
    };
  } catch (_) {}

  // 2. High-Frequency Video Ad Skipper & Fast-Forward (Runs every 80ms)
  function checkAndSkipAds() {
    try {
      const player = document.querySelector('ytmusic-player');
      const video = document.querySelector('video');

      // Check playerApi first if available
      if (player && player.playerApi && typeof player.playerApi.isAdPlaying === 'function' && player.playerApi.isAdPlaying()) {
        if (typeof player.playerApi.skipAd === 'function') {
          player.playerApi.skipAd();
        }
      }

      // Check DOM indicators
      const isAdActive =
        (player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))) ||
        document.querySelector('.ad-showing, .ad-interrupting, .video-ads, .ytp-ad-module, .ytp-ad-player-overlay, .ytp-ad-text') !== null;

      if (isAdActive && video) {
        video.muted = true;
        video.playbackRate = 16.0;
        if (!isNaN(video.duration) && video.duration > 0) {
          video.currentTime = video.duration - 0.05;
        }

        const skipBtns = document.querySelectorAll(
          '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .videoAdUiSkipButton, button.ytp-ad-skip-button-text'
        );
        skipBtns.forEach((b) => b && typeof b.click === 'function' && b.click());
      }

      // Auto-dismiss "Are you still watching?"
      const confirmBtn = document.querySelector('ytmusic-you-there-renderer yt-button-renderer button');
      if (confirmBtn) confirmBtn.click();
    } catch (_) {}
  }

  setInterval(checkAndSkipAds, 80);

  // 3. Cosmetic Filter via Stylesheet (Pure DOM)
  function injectCosmeticFilters() {
    if (document.getElementById('enix-adblock-styles')) return;
    const style = document.createElement('style');
    style.id = 'enix-adblock-styles';
    style.textContent = `
      ytmusic-mealbar-promo-renderer,
      ytmusic-banner-promo-renderer,
      .ytmusic-mealbar-promo-renderer,
      .ytmusic-banner-promo-renderer,
      ytmusic-pivot-bar-item-renderer[tab-id="SPunlimited"],
      .ytp-ad-overlay-container,
      .ytp-ad-message-container,
      .ytp-ad-progress-list,
      .video-ads,
      .ytp-ad-module,
      #player-ads {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    const target = document.head || document.documentElement;
    if (target) target.appendChild(style);
  }

  injectCosmeticFilters();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCosmeticFilters);
  }
})();
