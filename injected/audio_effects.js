// Enix Music - Advanced Audio: Spotify-like Normalization & 3-Band Equalizer (Pure DOM API)
(function () {
  'use strict';

  if (window.__enix_audio_effects_loaded) return;
  window.__enix_audio_effects_loaded = true;

  console.info('[Enix Music] Initializing Advanced Audio Engine (Pure DOM)...');

  let audioCtx = null;
  let sourceNode = null;
  let compressorNode = null;
  let gainNode = null;
  let bassFilter = null;
  let midFilter = null;
  let trebleFilter = null;

  let isNormalized = localStorage.getItem('enix_audio_norm') !== 'false';
  let currentPreset = localStorage.getItem('enix_eq_preset') || 'flat';
  let customGains = {
    bass: parseFloat(localStorage.getItem('enix_eq_bass') || '0'),
    mid: parseFloat(localStorage.getItem('enix_eq_mid') || '0'),
    treble: parseFloat(localStorage.getItem('enix_eq_treble') || '0')
  };

  const PRESETS = {
    flat: { name: 'Düz (Varsayılan)', bass: 0, mid: 0, treble: 0 },
    bass_boost: { name: 'Bas Güçlendirici', bass: 8, mid: 0, treble: 2 },
    vocal_boost: { name: 'Vokal', bass: -2, mid: 6, treble: 2 },
    treble_boost: { name: 'Tiz Güçlendirici', bass: -1, mid: 1, treble: 7 },
    night_mode: { name: 'Gece Modu', bass: -4, mid: 2, treble: -3 }
  };

  function initWebAudio() {
    const video = document.querySelector('video');
    if (!video || audioCtx) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      sourceNode = audioCtx.createMediaElementSource(video);

      // 1. Spotify-like Volume Normalization Dynamics Compressor
      compressorNode = audioCtx.createDynamicsCompressor();
      compressorNode.threshold.setValueAtTime(-24, audioCtx.currentTime);
      compressorNode.knee.setValueAtTime(30, audioCtx.currentTime);
      compressorNode.ratio.setValueAtTime(12, audioCtx.currentTime);
      compressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressorNode.release.setValueAtTime(0.25, audioCtx.currentTime);

      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(1.05, audioCtx.currentTime);

      // 2. 3-Band Equalizer (Bass 80Hz, Mid 1000Hz, Treble 8000Hz)
      bassFilter = audioCtx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.setValueAtTime(80, audioCtx.currentTime);

      midFilter = audioCtx.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
      midFilter.Q.setValueAtTime(1.0, audioCtx.currentTime);

      trebleFilter = audioCtx.createBiquadFilter();
      trebleFilter.type = 'highshelf';
      trebleFilter.frequency.setValueAtTime(8000, audioCtx.currentTime);

      reconnectAudioGraph();
      applyPresetGains(currentPreset);

      console.info('[Enix Music] Web Audio Graph connected successfully.');
    } catch (e) {
      console.debug('[Enix Music] AudioContext note:', e);
    }
  }

  function reconnectAudioGraph() {
    if (!sourceNode || !audioCtx) return;
    try {
      sourceNode.disconnect();
      compressorNode.disconnect();
      gainNode.disconnect();
      bassFilter.disconnect();
      midFilter.disconnect();
      trebleFilter.disconnect();

      let current = sourceNode;
      if (isNormalized) {
        current.connect(compressorNode);
        current = compressorNode;
      }

      current.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
    } catch (e) {
      console.debug('[Enix Audio] Graph reconnect error:', e);
    }
  }

  function applyPresetGains(presetKey) {
    currentPreset = presetKey;
    localStorage.setItem('enix_eq_preset', presetKey);

    const preset = PRESETS[presetKey] || PRESETS.flat;
    customGains = { bass: preset.bass, mid: preset.mid, treble: preset.treble };

    if (bassFilter && midFilter && trebleFilter && audioCtx) {
      const now = audioCtx.currentTime;
      bassFilter.gain.setTargetAtTime(customGains.bass, now, 0.05);
      midFilter.gain.setTargetAtTime(customGains.mid, now, 0.05);
      trebleFilter.gain.setTargetAtTime(customGains.treble, now, 0.05);
    }

    updatePanelUI();
  }

  function setBandGain(band, val) {
    customGains[band] = val;
    localStorage.setItem(`enix_eq_${band}`, val.toString());

    if (audioCtx) {
      const now = audioCtx.currentTime;
      if (band === 'bass' && bassFilter) bassFilter.gain.setTargetAtTime(val, now, 0.05);
      if (band === 'mid' && midFilter) midFilter.gain.setTargetAtTime(val, now, 0.05);
      if (band === 'treble' && trebleFilter) trebleFilter.gain.setTargetAtTime(val, now, 0.05);
    }
  }

  // Floating Audio Settings Modal (Pure DOM Creation)
  function ensureAudioPanel() {
    let panel = document.getElementById('enix-audio-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'enix-audio-panel';
    panel.style.cssText = [
      'position: fixed !important',
      'top: 68px !important',
      'right: 24px !important',
      'width: 320px !important',
      'background: rgba(20, 20, 26, 0.96) !important',
      'backdrop-filter: blur(20px) !important',
      '-webkit-backdrop-filter: blur(20px) !important',
      'border: 1px solid rgba(255, 255, 255, 0.16) !important',
      'border-radius: 20px !important',
      'box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7) !important',
      'z-index: 2147483647 !important',
      'display: none',
      'flex-direction: column',
      'gap: 14px',
      'padding: 18px',
      'color: #ffffff',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
      'user-select: none'
    ].join(';');

    // Header Row
    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;';
    const titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:6px;font-weight:700;font-size:14px;color:#ff2a5f;';
    titleBox.textContent = 'Ses Efektleri & Ekolayzır';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:transparent;border:none;color:rgba(255,255,255,0.6);font-size:16px;cursor:pointer;outline:none;';
    closeBtn.addEventListener('click', () => { panel.style.display = 'none'; });
    headerRow.appendChild(titleBox);
    headerRow.appendChild(closeBtn);
    panel.appendChild(headerRow);

    // Spotify Normalization Card
    const normCard = document.createElement('label');
    normCard.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.06);padding:10px 12px;border-radius:12px;cursor:pointer;';
    const normTextCol = document.createElement('div');
    const normTitle = document.createElement('div');
    normTitle.style.cssText = 'font-size:12px;font-weight:600;color:#fff;';
    normTitle.textContent = 'Spotify Ses Dengeleme';
    const normSub = document.createElement('div');
    normSub.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.5);';
    normSub.textContent = 'Şarkılar arası ses farkını otomatik dengeler';
    normTextCol.appendChild(normTitle);
    normTextCol.appendChild(normSub);

    const normCheckbox = document.createElement('input');
    normCheckbox.type = 'checkbox';
    normCheckbox.id = 'enix-norm-toggle';
    normCheckbox.checked = isNormalized;
    normCheckbox.style.cssText = 'accent-color:#ff2a5f;width:18px;height:18px;cursor:pointer;';
    normCheckbox.addEventListener('change', (e) => {
      isNormalized = e.target.checked;
      localStorage.setItem('enix_audio_norm', isNormalized.toString());
      reconnectAudioGraph();
    });

    normCard.appendChild(normTextCol);
    normCard.appendChild(normCheckbox);
    panel.appendChild(normCard);

    // Presets Section
    const presetsSection = document.createElement('div');
    const presetsLabel = document.createElement('div');
    presetsLabel.style.cssText = 'font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;';
    presetsLabel.textContent = 'Hazır Ayarlar (Presets)';
    presetsSection.appendChild(presetsLabel);

    const presetsGrid = document.createElement('div');
    presetsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:6px;';

    const presetKeys = ['flat', 'bass_boost', 'vocal_boost', 'treble_boost', 'night_mode'];
    presetKeys.forEach((key) => {
      const p = PRESETS[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'enix-p-btn';
      btn.setAttribute('data-preset', key);
      btn.textContent = p.name;
      btn.style.cssText = 'padding:6px;font-size:11px;border-radius:8px;cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:#fff;outline:none;';
      if (key === 'night_mode') btn.style.gridColumn = 'span 2';

      btn.addEventListener('click', () => applyPresetGains(key));
      presetsGrid.appendChild(btn);
    });
    presetsSection.appendChild(presetsGrid);
    panel.appendChild(presetsSection);

    // Sliders Box
    const slidersBox = document.createElement('div');
    slidersBox.style.cssText = 'display:flex;flex-direction:column;gap:10px;background:rgba(0,0,0,0.25);padding:12px;border-radius:12px;';

    const createBandSlider = (id, labelText, bandKey) => {
      const wrap = document.createElement('div');
      const infoRow = document.createElement('div');
      infoRow.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:4px;';
      const label = document.createElement('span');
      label.textContent = labelText;
      const valLabel = document.createElement('span');
      valLabel.id = `enix-val-${id}`;
      valLabel.textContent = `${customGains[bandKey] > 0 ? '+' : ''}${customGains[bandKey]} dB`;
      infoRow.appendChild(label);
      infoRow.appendChild(valLabel);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.id = `enix-slider-${id}`;
      slider.min = '-12';
      slider.max = '12';
      slider.step = '0.5';
      slider.value = customGains[bandKey].toString();
      slider.style.cssText = 'width:100%;accent-color:#ff2a5f;cursor:pointer;';

      slider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        valLabel.textContent = `${v > 0 ? '+' : ''}${v} dB`;
        setBandGain(bandKey, v);
      });

      wrap.appendChild(infoRow);
      wrap.appendChild(slider);
      return wrap;
    };

    slidersBox.appendChild(createBandSlider('bass', 'Bass (80 Hz)', 'bass'));
    slidersBox.appendChild(createBandSlider('mid', 'Orta / Vokal (1 kHz)', 'mid'));
    slidersBox.appendChild(createBandSlider('treble', 'Tiz (8 kHz)', 'treble'));
    panel.appendChild(slidersBox);

    document.body.appendChild(panel);
    updatePanelUI();
    return panel;
  }

  function updatePanelUI() {
    const panel = document.getElementById('enix-audio-panel');
    if (!panel) return;

    panel.querySelectorAll('.enix-p-btn').forEach((btn) => {
      const p = btn.getAttribute('data-preset');
      if (p === currentPreset) {
        btn.style.background = '#ff2a5f';
        btn.style.borderColor = '#ff2a5f';
        btn.style.fontWeight = '700';
      } else {
        btn.style.background = 'rgba(255,255,255,0.08)';
        btn.style.borderColor = 'rgba(255,255,255,0.15)';
        btn.style.fontWeight = '500';
      }
    });

    ['bass', 'mid', 'treble'].forEach((b) => {
      const sl = panel.querySelector(`#enix-slider-${b}`);
      const lb = panel.querySelector(`#enix-val-${b}`);
      if (sl) sl.value = customGains[b];
      if (lb) lb.textContent = `${customGains[b] > 0 ? '+' : ''}${customGains[b]} dB`;
    });
  }

  window.enixApplyEqualizerPreset = function (presetKey) {
    applyPresetGains(presetKey);
  };

  window.enixSetAudioNormalization = function (enabled) {
    isNormalized = enabled;
    localStorage.setItem('enix_audio_norm', enabled.toString());
    reconnectAudioGraph();
  };

  window.enixToggleAudioPanel = function () {
    const panel = ensureAudioPanel();
    const isVisible = panel.style.display === 'flex';
    panel.style.display = isVisible ? 'none' : 'flex';
  };

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('enix-audio-panel');
    if (panel && panel.style.display === 'flex') {
      if (!panel.contains(e.target) && !e.target.closest('#enix-open-audio-btn')) {
        panel.style.display = 'none';
      }
    }
  });

  function setupMouseWheelVolume() {
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (!playerBar || playerBar.__enix_wheel_bound) return;
    playerBar.__enix_wheel_bound = true;

    playerBar.addEventListener('wheel', (e) => {
      e.preventDefault();
      const video = document.querySelector('video');
      if (!video) return;
      const step = 0.05;
      const delta = e.deltaY < 0 ? step : -step;
      video.volume = Math.max(0, Math.min(1, video.volume + delta));
    }, { passive: false });
  }

  document.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    } else if (!audioCtx) {
      initWebAudio();
    }
  }, { once: false });

  setInterval(() => {
    if (!audioCtx) initWebAudio();
    setupMouseWheelVolume();
  }, 1000);
})();
