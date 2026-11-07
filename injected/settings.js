// Enix Music - Clean Native Settings Modal & Unified Settings Controller
(function () {
  'use strict';

  if (window.__enix_settings_loaded) return;
  window.__enix_settings_loaded = true;

  console.info('[Enix Music] Initializing Unified Settings Modal...');

  // Determine current language ('tr' or 'en')
  function getActiveLanguage() {
    const saved = localStorage.getItem('enix_language');
    if (saved && (saved === 'tr' || saved === 'en')) return saved;
    const docLang = (document.documentElement.lang || navigator.language || '').toLowerCase();
    if (docLang.startsWith('en')) return 'en';
    return 'tr';
  }

  const activeLang = getActiveLanguage();

  const i18n = {
    tr: {
      settings: 'Ayarlar',
      close: 'Kapat',
      // Section 1: Genel
      secGeneral: '1. GENEL',
      language: 'Dil',
      languageDesc: 'Uygulama ve YouTube Music arayüz dilini değiştir.',
      location: 'Konum',
      locationDesc: 'Trendler ve öneriler için bölgesel içerik konumu.',
      autostart: 'Bilgisayar Başlangıcında Çalıştır',
      autostartDesc: 'Sistem açıldığında uygulamayı otomatik başlat.',
      minimizeToTray: 'Sistem Tepsisine Küçült',
      minimizeToTrayDesc: 'Kapatıldığında arka planda çalışmaya devam et.',
      // Section 2: Oynatma ve Görüntü
      secPlayback: '2. OYNATMA VE GÖRÜNTÜ',
      audioQuality: 'Ses Kalitesi',
      audioQualityHigh: 'Yüksek (256 kbps AAC)',
      audioQualityNormal: 'Standart (128 kbps AAC)',
      audioQualityLow: 'Düşük (48 kbps AAC)',
      audioOnly: 'Yalnızca Ses Modu',
      audioOnlyDesc: 'Videoları yüklemeden sadece şarkı sesini çal.',
      videoQuality: 'Video Kalitesi',
      audioNorm: 'Ses Seviyesi Normalleştirme',
      audioNormDesc: 'Tüm şarkıları aynı ses seviyesinde tut.',
      restrictedMode: 'Kısıtlı Mod',
      restrictedModeDesc: 'Uygunsuz olabilecek şarkı ve video içeriklerini filtrele.',
      // Section 3: Entegrasyonlar ve Kısayollar
      secIntegrations: '3. ENTEGRASYONLAR VE KISAYOLLAR',
      mediaKeys: 'Klavye Medya Tuşları',
      mediaKeysDesc: 'Klavye üzerindeki oynat/duraklat tuşlarını ve görev çubuğu kontrollerini etkinleştir.',
      discordRpc: 'Discord Durumu',
      discordRpcDesc: 'Çalan şarkıyı Discord\'da "Şu an dinliyor" olarak göster.',
      shortcuts: 'Klavye Kısayolları',
      shortcutsDesc: 'Kısayol tuşlarını listele.',
      shortcutsBtn: 'Listele',
      shortcutsAlert: 'Varsayılan Klavye Kısayolları:\n\n• Boşluk: Oynat / Duraklat\n• J / Sol Ok: 10 Saniye Geri\n• L / Sağ Ok: 10 Saniye İleri\n• M: Sesi Kapat / Aç\n• Yukarı / Aşağı Ok: Ses Ayarı\n• Ctrl + Shift + N: Sonraki Şarkı\n• Ctrl + Shift + P: Önceki Şarkı',
      // Section 4: Hakkında
      secAbout: '4. HAKKINDA',
      versionDesc: 'Sürüm 0.3.0 (Windows Yerel İstemcisi)',
      checkUpdates: 'Güncellemeleri Denetle',
      checkingUpdates: 'Denetleniyor...',
      upToDate: 'Güncel (v0.3.0)',
      updateAvailable: (v) => `Yeni Sürüm (${v}) Mevcut`,
      nativeYtSettings: 'YouTube Gelişmiş Ayarları',
      nativeYtSettingsDesc: 'Google hesap, geçmiş ve gizlilik ayarlarını aç.',
      nativeYtSettingsBtn: 'Gelişmiş Ayarlar',
      sourceCode: 'Kaynak Kodu',
      sourceCodeDesc: 'GPL-3.0 Açık Kaynak Masaüstü İstemcisi',
      githubRepo: 'GitHub Deposu'
    },
    en: {
      settings: 'Settings',
      close: 'Close',
      // Section 1: General
      secGeneral: '1. GENERAL',
      language: 'Language',
      languageDesc: 'Change interface language for app and YouTube Music.',
      location: 'Location',
      locationDesc: 'Regional content location for trends and recommendations.',
      autostart: 'Launch on Startup',
      autostartDesc: 'Automatically start app when Windows boots.',
      minimizeToTray: 'Minimize to System Tray',
      minimizeToTrayDesc: 'Keep running in background when window is closed.',
      // Section 2: Playback & Display
      secPlayback: '2. PLAYBACK & DISPLAY',
      audioQuality: 'Audio Quality',
      audioQualityHigh: 'High (256 kbps AAC)',
      audioQualityNormal: 'Standard (128 kbps AAC)',
      audioQualityLow: 'Low (48 kbps AAC)',
      audioOnly: 'Audio-Only Mode',
      audioOnlyDesc: 'Play only song audio without loading video streams.',
      videoQuality: 'Video Quality',
      audioNorm: 'Volume Normalization',
      audioNormDesc: 'Keep all tracks at consistent volume levels.',
      restrictedMode: 'Restricted Mode',
      restrictedModeDesc: 'Filter songs and videos that may contain mature content.',
      // Section 3: Integrations & Shortcuts
      secIntegrations: '3. INTEGRATIONS & SHORTCUTS',
      mediaKeys: 'Keyboard Media Keys',
      mediaKeysDesc: 'Enable play/pause and track controls from keyboard & taskbar.',
      discordRpc: 'Discord Rich Presence',
      discordRpcDesc: 'Show currently playing track on Discord as "Listening to".',
      shortcuts: 'Keyboard Shortcuts',
      shortcutsDesc: 'View shortcut keybindings.',
      shortcutsBtn: 'View',
      shortcutsAlert: 'Default Keyboard Shortcuts:\n\n• Space: Play / Pause\n• J / Left Arrow: 10 Seconds Backward\n• L / Right Arrow: 10 Seconds Forward\n• M: Mute / Unmute\n• Up / Down Arrow: Volume\n• Ctrl + Shift + N: Next Track\n• Ctrl + Shift + P: Previous Track',
      // Section 4: About
      secAbout: '4. ABOUT',
      versionDesc: 'Version 0.3.0 (Windows Native Client)',
      checkUpdates: 'Check for Updates',
      checkingUpdates: 'Checking...',
      upToDate: 'Up to Date (v0.3.0)',
      updateAvailable: (v) => `New Version (${v}) Available`,
      nativeYtSettings: 'YouTube Account Settings',
      nativeYtSettingsDesc: 'Open Google account, history and privacy options.',
      nativeYtSettingsBtn: 'Advanced Settings',
      sourceCode: 'Source Code',
      sourceCodeDesc: 'GPL-3.0 Open Source Desktop Client',
      githubRepo: 'GitHub Repository'
    }
  };

  const t = i18n[activeLang] || i18n.tr;

  function createSvg(width, height, pathD, viewBox = '0 0 24 24') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('fill', 'currentColor');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    svg.appendChild(path);
    return svg;
  }

  function createSwitch(storageKey, defaultValue, onChange) {
    const label = document.createElement('label');
    label.className = 'enix-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = 'enix-switch-' + storageKey;
    input.dataset.key = storageKey;
    const isChecked = localStorage.getItem(storageKey) !== null
      ? localStorage.getItem(storageKey) === 'true'
      : defaultValue;
    input.checked = isChecked;

    const slider = document.createElement('span');
    slider.className = 'enix-slider';

    input.addEventListener('change', (e) => {
      localStorage.setItem(storageKey, e.target.checked.toString());
      if (typeof onChange === 'function') onChange(e.target.checked);
    });

    label.appendChild(input);
    label.appendChild(slider);
    return label;
  }

  function createSelect(options, storageKey, defaultValue, onChange) {
    const select = document.createElement('select');
    select.className = 'enix-select';

    const savedVal = localStorage.getItem(storageKey) || defaultValue;

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === savedVal) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      localStorage.setItem(storageKey, e.target.value);
      if (typeof onChange === 'function') onChange(e.target.value);
    });

    return select;
  }

  function createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'enix-btn-secondary';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function createRow(titleText, descText, controlElement) {
    const row = document.createElement('div');
    row.className = 'enix-setting-row';

    const title = document.createElement('div');
    title.className = 'enix-setting-title';
    title.textContent = titleText;

    const desc = document.createElement('div');
    desc.className = 'enix-setting-desc';
    desc.textContent = descText || '';

    const control = document.createElement('div');
    control.className = 'enix-setting-control';
    control.appendChild(controlElement);

    row.appendChild(title);
    row.appendChild(desc);
    row.appendChild(control);
    return row;
  }

  function createSection(sectionNumberTitle, rows) {
    const section = document.createElement('div');
    section.className = 'enix-settings-section';

    const title = document.createElement('div');
    title.className = 'enix-section-title';
    title.textContent = sectionNumberTitle;

    const card = document.createElement('div');
    card.className = 'enix-section-card';

    rows.forEach((r) => card.appendChild(r));

    section.appendChild(title);
    section.appendChild(card);
    return section;
  }

  // Sync settings (hide to tray, autostart) to Tauri Rust backend
  function syncSettingsToRust() {
    try {
      const hideToTray = localStorage.getItem('enix_hide_to_tray') !== null
        ? localStorage.getItem('enix_hide_to_tray') === 'true'
        : true;
      const autostart = localStorage.getItem('enix_autostart') !== null
        ? localStorage.getItem('enix_autostart') === 'true'
        : false;

      if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
        window.__TAURI_INTERNALS__.invoke('plugin:event|emit', {
          event: 'enix-settings-changed',
          payload: {
            hide_to_tray: hideToTray,
            autostart: autostart
          }
        }).catch((e) => console.debug('[Enix Settings Sync Error]:', e));
      }
    } catch (_) {}
  }

  // Initial sync on script load
  syncSettingsToRust();
  setInterval(syncSettingsToRust, 3000);

  // Real YouTube Music Language Switcher
  function applyLanguage(newLang) {
    localStorage.setItem('enix_language', newLang);
    const now = new Date();
    now.setFullYear(now.getFullYear() + 2);
    const expires = now.toUTCString();

    let pref = '';
    document.cookie.split(';').forEach((c) => {
      const trimmed = c.trim();
      if (trimmed.startsWith('PREF=')) {
        pref = trimmed.substring(5);
      }
    });

    const params = new URLSearchParams(pref);
    params.set('hl', newLang);
    document.cookie = `PREF=${params.toString()}; domain=.youtube.com; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `PREF=${params.toString()}; path=/; expires=${expires}; SameSite=Lax`;

    const url = new URL(window.location.href);
    url.searchParams.set('hl', newLang);
    url.searchParams.set('persist_hl', '1');
    window.location.href = url.toString();
  }

  // Real YouTube Music Content Location Switcher
  function applyLocation(newLoc) {
    localStorage.setItem('enix_location', newLoc);
    const now = new Date();
    now.setFullYear(now.getFullYear() + 2);
    const expires = now.toUTCString();

    let pref = '';
    document.cookie.split(';').forEach((c) => {
      const trimmed = c.trim();
      if (trimmed.startsWith('PREF=')) {
        pref = trimmed.substring(5);
      }
    });

    const params = new URLSearchParams(pref);
    params.set('gl', newLoc);
    document.cookie = `PREF=${params.toString()}; domain=.youtube.com; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `PREF=${params.toString()}; path=/; expires=${expires}; SameSite=Lax`;

    const url = new URL(window.location.href);
    url.searchParams.set('gl', newLoc);
    url.searchParams.set('persist_gl', '1');
    window.location.href = url.toString();
  }

  // Real YouTube Music Restricted Mode Switcher
  function applyRestrictedMode(enabled) {
    localStorage.setItem('enix_restricted_mode', enabled.toString());
    const now = new Date();
    now.setFullYear(now.getFullYear() + 2);
    const expires = now.toUTCString();

    let pref = '';
    document.cookie.split(';').forEach((c) => {
      const trimmed = c.trim();
      if (trimmed.startsWith('PREF=')) {
        pref = trimmed.substring(5);
      }
    });

    const params = new URLSearchParams(pref);
    if (enabled) {
      params.set('f2', '8000000');
    } else {
      params.delete('f2');
    }
    document.cookie = `PREF=${params.toString()}; domain=.youtube.com; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `PREF=${params.toString()}; path=/; expires=${expires}; SameSite=Lax`;
  }

  // Open native YouTube settings dialog if explicitly requested
  function openNativeYouTubeSettings() {
    window.enixCloseSettings();
    try {
      const app = document.querySelector('ytmusic-app') || document.body;
      app.dispatchEvent(new CustomEvent('yt-action', {
        bubbles: true,
        composed: true,
        detail: { actionName: 'ytmusic-open-settings-action' }
      }));
    } catch (_) {}
  }

  function ensureSettingsModal() {
    let backdrop = document.getElementById('enix-settings-backdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'enix-settings-backdrop';

    const dialog = document.createElement('div');
    dialog.id = 'enix-settings-dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'enix-modal-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'enix-modal-title';
    titleEl.textContent = t.settings;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'enix-modal-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = t.close;
    closeBtn.addEventListener('click', () => {
      backdrop.style.display = 'none';
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'enix-modal-body';

    // Section 1: GENEL / GENERAL
    const section1Rows = [
      createRow(
        t.language,
        t.languageDesc,
        createSelect(
          [
            { value: 'tr', label: 'Türkçe' },
            { value: 'en', label: 'English' }
          ],
          'enix_language',
          activeLang,
          (newLang) => {
            applyLanguage(newLang);
          }
        )
      ),
      createRow(
        t.location,
        t.locationDesc,
        createSelect(
          [
            { value: 'TR', label: 'Türkiye' },
            { value: 'US', label: 'United States' },
            { value: 'GB', label: 'United Kingdom' },
            { value: 'DE', label: 'Deutschland' },
            { value: 'FR', label: 'France' },
            { value: 'AZ', label: 'Azərbaycan' },
            { value: 'NL', label: 'Nederland' }
          ],
          'enix_location',
          'TR',
          (newLoc) => {
            applyLocation(newLoc);
          }
        )
      ),
      createRow(
        t.autostart,
        t.autostartDesc,
        createSwitch('enix_autostart', false, () => {
          syncSettingsToRust();
        })
      ),
      createRow(
        t.minimizeToTray,
        t.minimizeToTrayDesc,
        createSwitch('enix_hide_to_tray', true, () => {
          syncSettingsToRust();
        })
      )
    ];
    body.appendChild(createSection(t.secGeneral, section1Rows));

    // Section 2: OYNATMA VE GÖRÜNTÜ / PLAYBACK & DISPLAY
    const section2Rows = [
      createRow(
        t.audioQuality,
        '',
        createSelect(
          [
            { value: '256', label: t.audioQualityHigh },
            { value: '128', label: t.audioQualityNormal },
            { value: '48', label: t.audioQualityLow }
          ],
          'enix_audio_quality',
          '256'
        )
      ),
      createRow(
        t.audioOnly,
        t.audioOnlyDesc,
        createSwitch(
          'enix_audio_only_default',
          typeof window.enixIsVideoMode === 'function' ? !window.enixIsVideoMode() : false,
          (val) => {
            if (typeof window.enixToggleVideoMode === 'function') {
              window.enixToggleVideoMode(!val);
            }
          }
        )
      ),
      createRow(
        t.videoQuality,
        '',
        createSelect(
          [
            { value: '1080', label: '1080p (FHD)' },
            { value: '720', label: '720p (HD)' },
            { value: '480', label: '480p' },
            { value: '360', label: '360p' }
          ],
          'enix_video_quality',
          '1080'
        )
      ),
      createRow(
        t.audioNorm,
        t.audioNormDesc,
        createSwitch('enix_audio_norm', true, (val) => {
          if (typeof window.enixSetAudioNormalization === 'function') {
            window.enixSetAudioNormalization(val);
          }
        })
      ),
      createRow(
        t.restrictedMode,
        t.restrictedModeDesc,
        createSwitch('enix_restricted_mode', false, (val) => {
          applyRestrictedMode(val);
        })
      )
    ];
    body.appendChild(createSection(t.secPlayback, section2Rows));

    // Section 3: ENTEGRASYONLAR VE KISAYOLLAR / INTEGRATIONS & SHORTCUTS
    const section3Rows = [
      createRow(
        t.mediaKeys,
        t.mediaKeysDesc,
        createSwitch('enix_smtc_enabled', true)
      ),
      createRow(
        t.discordRpc,
        t.discordRpcDesc,
        createSwitch('enix_discord_rpc', true)
      ),
      createRow(
        t.shortcuts,
        t.shortcutsDesc,
        createButton(t.shortcutsBtn, () => {
          alert(t.shortcutsAlert);
        })
      )
    ];
    body.appendChild(createSection(t.secIntegrations, section3Rows));

    // Section 4: HAKKINDA / ABOUT
    const updateBtn = createButton(t.checkUpdates, () => {
      updateBtn.textContent = t.checkingUpdates;
      try {
        if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
          window.__TAURI_INTERNALS__.invoke('check_app_updates').then((res) => {
            if (res && res.has_update) {
              updateBtn.textContent = t.updateAvailable(res.latest_version);
            } else {
              updateBtn.textContent = t.upToDate;
            }
          }).catch(() => {
            updateBtn.textContent = t.upToDate;
          });
        } else {
          updateBtn.textContent = t.upToDate;
        }
      } catch (_) {
        updateBtn.textContent = t.upToDate;
      }
    });

    const section4Rows = [
      createRow(
        'Enix Music',
        t.versionDesc,
        updateBtn
      ),
      createRow(
        t.nativeYtSettings,
        t.nativeYtSettingsDesc,
        createButton(t.nativeYtSettingsBtn, () => {
          openNativeYouTubeSettings();
        })
      ),
      createRow(
        t.sourceCode,
        t.sourceCodeDesc,
        createButton(t.githubRepo, () => {
          window.open('https://github.com/enixyazilim/EnixMusic', '_blank');
        })
      )
    ];
    body.appendChild(createSection(t.secAbout, section4Rows));

    dialog.appendChild(body);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.style.display = 'none';
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.style.display === 'flex') {
        backdrop.style.display = 'none';
      }
    });

    return backdrop;
  }

  window.enixOpenSettings = function () {
    const modal = ensureSettingsModal();
    const audioOnlySw = document.getElementById('enix-switch-enix_audio_only_default');
    if (audioOnlySw && typeof window.enixIsVideoMode === 'function') {
      const isVideo = window.enixIsVideoMode();
      audioOnlySw.checked = !isVideo;
      localStorage.setItem('enix_audio_only_default', (!isVideo).toString());
    }
    modal.style.display = 'flex';
  };

  window.addEventListener('enix:av-mode-changed', (e) => {
    const isVideo = Boolean(e.detail && e.detail.isVideoMode);
    const audioOnlySw = document.getElementById('enix-switch-enix_audio_only_default');
    if (audioOnlySw) {
      audioOnlySw.checked = !isVideo;
    }
    localStorage.setItem('enix_audio_only_default', (!isVideo).toString());
  });

  window.enixCloseSettings = function () {
    const modal = document.getElementById('enix-settings-backdrop');
    if (modal) modal.style.display = 'none';
  };

  window.__enix__ = window.__enix__ || {};
  window.__enix__.openSettings = window.enixOpenSettings;
  window.__enix__.closeSettings = window.enixCloseSettings;

  // Inject "Ayarlar" / "Settings" neatly into YouTube Music's native left sidebar with identical font & layout
  function injectSidebarSettingsEntry() {
    let entry = document.getElementById('enix-guide-settings-entry');
    if (entry && entry.querySelector('.title') && entry.querySelector('svg')) {
      return; // Already cleanly injected with icon and title
    }
    if (entry) {
      entry.remove();
      entry = null;
    }

    const guideSection = document.querySelector('ytmusic-guide-section-renderer:first-of-type #items, ytmusic-guide-section-renderer #items, #guide-wrapper ytmusic-guide-section-renderer #items');
    if (!guideSection) return;

    entry = document.createElement('div');
    entry.id = 'enix-guide-settings-entry';
    entry.setAttribute('role', 'button');
    entry.setAttribute('tabindex', '0');

    const gearSvg = createSvg(
      24,
      24,
      'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'
    );

    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = t.settings;

    entry.appendChild(gearSvg);
    entry.appendChild(titleSpan);

    entry.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.enixOpenSettings();
    });

    entry.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.enixOpenSettings();
      }
    });

    guideSection.appendChild(entry);
  }

  // Inject "Ayarlar" / "Settings" neatly into YouTube Music's collapsed mini sidebar (mini-guide)
  function injectMiniGuideSettingsEntry() {
    let entry = document.getElementById('enix-mini-guide-settings-entry');
    if (entry && entry.querySelector('.title') && entry.querySelector('svg')) {
      return;
    }
    if (entry) {
      entry.remove();
      entry = null;
    }

    const miniGuideItems = document.querySelector('ytmusic-mini-guide-renderer #items, #mini-guide #items');
    if (!miniGuideItems) return;

    entry = document.createElement('div');
    entry.id = 'enix-mini-guide-settings-entry';
    entry.setAttribute('role', 'button');
    entry.setAttribute('tabindex', '0');
    entry.title = t.settings;

    const gearSvg = createSvg(
      24,
      24,
      'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'
    );

    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = t.settings;

    entry.appendChild(gearSvg);
    entry.appendChild(titleSpan);

    entry.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.enixOpenSettings();
    });

    entry.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.enixOpenSettings();
      }
    });

    // Insert right after the 3rd item (Kitaplık) if available, otherwise append
    const entries = miniGuideItems.querySelectorAll('ytmusic-mini-guide-entry-renderer');
    if (entries.length >= 3 && entries[2].nextSibling) {
      miniGuideItems.insertBefore(entry, entries[2].nextSibling);
    } else {
      miniGuideItems.appendChild(entry);
    }
  }

  setInterval(injectSidebarSettingsEntry, 1000);
  setInterval(injectMiniGuideSettingsEntry, 1000);

  // Intercept click on native YouTube Music 3-dots top-right menu "Ayarlar" / "Settings"
  document.addEventListener('click', (e) => {
    const menuItem = e.target.closest('ytmusic-menu-navigation-item-renderer, ytmusic-menu-service-item-renderer, tp-yt-paper-item, ytd-menu-service-item-renderer');
    if (!menuItem) return;

    const popup = menuItem.closest('ytmusic-menu-popup-renderer, tp-yt-iron-dropdown');
    if (!popup) return;

    const text = (menuItem.textContent || '').trim().toLowerCase();
    if (text === 'ayarlar' || text === 'settings' || text.startsWith('ayar') || text.startsWith('setting')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try {
        const ironDropdown = popup.closest('tp-yt-iron-dropdown') || popup;
        if (typeof ironDropdown.close === 'function') {
          ironDropdown.close();
        } else {
          ironDropdown.style.display = 'none';
        }
      } catch (_) {}

      // Click outside to dismiss backdrop overlay
      const overlayBackdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
      if (overlayBackdrop) overlayBackdrop.click();

      window.enixOpenSettings();
    }
  }, true);
})();
