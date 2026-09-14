// IMPORTANT NOTES ABOUT THIS FILE
//
// This file contains all logic related to interacting with YTM itself and works under the assumption of a trusted environment and data.
// Anything passed to this file does not necessarily need to be or will be validated.
//
// If adding new things to this file ensure best security practices are followed.
// - executeJavaScript is used to enter the main world when you need to interact with YTM APIs or anything from YTM that would otherwise need the prototypes or events from YTM.
//   - Always wrap your executeJavaScript code in an IIFE calling it from outside executeJavaScript when it returns
// - Add functions to exposeInMainWorld when you need to call back to the main program. By nature you should not trust data coming from this.

import { contextBridge, ipcRenderer, webFrame } from "electron";
import Store from "../store-ipc/store";
import { StoreSchema } from "~shared/store/schema";

window.addEventListener("error", (event) => {
  console.error("Renderer error caught in preload:", event.message, "at", event.filename, ":", event.lineno, ":", event.colno, "stack:", event.error?.stack);
});

import playerBarControlsScript from "./scripts/playerbarcontrols.script?raw";
import hookPlayerApiEventsScript from "./scripts/hookplayerapievents.script?raw";
import getPlaylistsScript from "./scripts/getplaylists.script?raw";
import toggleLikeScript from "./scripts/togglelike.script?raw";
import toggleDislikeScript from "./scripts/toggledislike.script?raw";

const store = new Store<StoreSchema>();

const injectEarlyFixStyles = () => {
  if (document.getElementById("enixm-early-fix-style")) return;
  const style = document.createElement("style");
  style.id = "enixm-early-fix-style";
  style.textContent = `
    #skip-navigation,
    a#skip-navigation,
    .ytmusic-skip-navigation-button,
    yt-button-shape#skip-navigation,
    [id="skip-navigation"],
    ytmusic-nav-bar #skip-navigation,
    yt-skip-navigation-button,
    .skip-nav,
    .skip-navigation,
    tp-yt-paper-button#skip-navigation,
    ytmusic-bubble-renderer,
    yt-bubble-hint-renderer,
    yt-hint-renderer,
    ytmusic-hint-renderer,
    yt-tooltip-renderer,
    .ytmusic-bubble-renderer,
    .yt-bubble-hint-renderer,
    tp-yt-paper-tooltip[for="skip-navigation"],
    paper-tooltip[for="skip-navigation"],
    ytmusic-you-there-renderer[hidden],
    ytmusic-pivot-bar-renderer #skip-navigation,
    tp-yt-iron-overlay-backdrop:not([opened]):not(.opened),
    iron-overlay-backdrop:not([opened]):not(.opened),
    tp-yt-paper-dialog:not([opened]):not(.opened),
    paper-dialog:not([opened]):not(.opened) {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      clip: rect(0, 0, 0, 0) !important;
      clip-path: inset(50%) !important;
    }
  `;
  const parent = document.head || document.documentElement || document.body;
  if (parent) parent.appendChild(style);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectEarlyFixStyles);
} else {
  injectEarlyFixStyles();
}

if (window.location.hostname === "accounts.google.com" || window.location.hostname === "myaccount.google.com") {
  const applyDarkTheme = () => {
    if (document.documentElement) {
      if (document.getElementById("google-dark-theme-style")) return;
      const style = document.createElement("style");
      style.id = "google-dark-theme-style";
      style.textContent = `
        html {
          filter: invert(1) hue-rotate(180deg) !important;
          background-color: #121212 !important;
        }
        img, video, iframe, canvas, svg {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `;
      document.documentElement.appendChild(style);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyDarkTheme);
  } else {
    applyDarkTheme();
  }
}

contextBridge.exposeInMainWorld("enixm", {
  sendVideoProgress: (volume: number) => ipcRenderer.send("enixmView:videoProgressChanged", volume),
  sendVideoState: (state: number) => ipcRenderer.send("enixmView:videoStateChanged", state),
  sendVideoData: (videoDetails: unknown, playlistId: string, album: { id: string; text: string }, likeStatus: unknown, hasFullMetadata: boolean) =>
    ipcRenderer.send("enixmView:videoDataChanged", videoDetails, playlistId, album, likeStatus, hasFullMetadata),
  sendStoreUpdate: (queueState: unknown, likeStatus: string, volume: number, muted: boolean, adPlaying: boolean) =>
    ipcRenderer.send("enixmView:storeStateChanged", queueState, likeStatus, volume, muted, adPlaying),
  sendCreatePlaylistObservation: (playlist: unknown) => ipcRenderer.send("enixmView:createPlaylistObserved", playlist),
  sendDeletePlaylistObservation: (playlistId: string) => ipcRenderer.send("enixmView:deletePlaylistObserved", playlistId)
});

function createStyleSheet() {
  const css = document.createElement("style");
  css.appendChild(
    document.createTextNode(`
      .enixm-history-back, .enixm-history-forward {
        cursor: pointer;
        margin: 0 18px 0 2px;
        font-size: 24px;
        color: rgba(255, 255, 255, 0.5);
      }

      .enixm-history-back.pivotbar, .enixm-history-forward.pivotbar {
        padding-top: 12px;
      }

      .enixm-history-back.disabled, .enixm-history-forward.disabled {
        cursor: not-allowed;
      }

      .enixm-history-back:hover:not(.disabled), .enixm-history-forward:hover:not(.disabled) {
        color: #FFFFFF;
      }

      .enixm-hidden {
        display: none;
      }

      .enixm-persist-volume-slider {
        opacity: 1 !important;
        pointer-events: initial !important;
      }
      
      .enixm-player-bar-control.library-button {
        margin-left: 8px;
      }

      .enixm-player-bar-control.library-button.hidden {
        display: none;
      }

      .enixm-player-bar-control.playlist-button {
        margin-left: 8px;
      }

      .enixm-player-bar-control.playlist-button.hidden {
        display: none;
      }

      .enixm-player-bar-control.sleep-timer-button.active {
        color: #FFFFFF;
      }

      /* Force compact menu layout and override touch UI spacing */
      ytmusic-menu-navigation-item-renderer,
      ytmusic-menu-service-item-renderer,
      ytmusic-toggle-menu-service-item-renderer {
        padding: 0 !important;
        margin: 0 !important;
      }
      ytmusic-menu-popup-renderer paper-icon-item,
      ytmusic-menu-popup-renderer tp-yt-paper-icon-item,
      ytmusic-menu-popup-renderer paper-item,
      ytmusic-menu-popup-renderer tp-yt-paper-item {
        min-height: 36px !important;
        height: auto !important;
        padding: 4px 16px !important;
        box-sizing: border-box !important;
      }
      ytmusic-menu-divider-renderer {
        margin: 4px 0 !important;
        padding: 0 !important;
      }

      /* Hatalı oluşturulamayan menü öğelerinin bıraktığı boşlukları gizle */
      ytmusic-menu-service-item-renderer:empty,
      ytmusic-menu-navigation-item-renderer:empty,
      ytmusic-toggle-menu-service-item-renderer:empty {
        display: none !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      /* YouTube Music erişilebilirlik (skip-navigation / oynatmayı başlat) butonunun logoyla çakışmasını engelle */
      #skip-navigation,
      a#skip-navigation,
      .ytmusic-skip-navigation-button,
      yt-button-shape#skip-navigation,
      [id="skip-navigation"],
      ytmusic-nav-bar #skip-navigation,
      yt-skip-navigation-button,
      .skip-nav,
      .skip-navigation {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }

      /* Touch UI menüsünde gereksiz boşluk oluşturan wrapper'ları sıkıştır */
      ytmusic-menu-popup-renderer tp-yt-paper-listbox,
      ytmusic-menu-popup-renderer paper-listbox {
        padding-top: 4px !important;
        padding-bottom: 4px !important;
      }
    `)
  );
  document.head.appendChild(css);
}

function createMaterialSymbolsLink() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100,0,0";
  return link;
}

function createNavigationMenuArrows() {
  // Go back in history
  const historyBackElement = document.createElement("span");
  historyBackElement.classList.add("material-symbols-outlined", "enixm-history-back", "disabled");
  historyBackElement.innerText = "west";

  historyBackElement.addEventListener("click", function () {
    if (!historyBackElement.classList.contains("disabled")) {
      history.back();
    }
  });

  // Go forward in history
  const historyForwardElement = document.createElement("span");
  historyForwardElement.classList.add("material-symbols-outlined", "enixm-history-forward", "disabled");
  historyForwardElement.innerText = "east";

  historyForwardElement.addEventListener("click", function () {
    if (!historyForwardElement.classList.contains("disabled")) {
      history.forward();
    }
  });

  ipcRenderer.on("enixmView:navigationStateChanged", (event, state) => {
    if (state.canGoBack) {
      historyBackElement.classList.remove("disabled");
    } else {
      historyBackElement.classList.add("disabled");
    }

    if (state.canGoForward) {
      historyForwardElement.classList.remove("disabled");
    } else {
      historyForwardElement.classList.add("disabled");
    }
  });

  const pivotBar = document.querySelector("ytmusic-pivot-bar-renderer");
  if (!pivotBar) {
    // New YTM UI
    const searchBar = document.querySelector("ytmusic-search-box");
    if (searchBar && searchBar.parentNode) {
      const navBar = searchBar.parentNode;
      navBar.insertBefore(historyForwardElement, searchBar);
      navBar.insertBefore(historyBackElement, historyForwardElement);
    }
  } else {
    historyForwardElement.classList.add("pivotbar");
    historyBackElement.classList.add("pivotbar");
    pivotBar.prepend(historyForwardElement);
    pivotBar.prepend(historyBackElement);
  }
}

function createKeyboardNavigation() {
  const keyboardNavigation = document.createElement("div");
  keyboardNavigation.tabIndex = 32767;
  keyboardNavigation.onfocus = () => {
    keyboardNavigation.blur();
    ipcRenderer.send("enixmView:switchFocus", "main");
  };
  document.body.appendChild(keyboardNavigation);
}

async function createAdditionalPlayerBarControls() {
  const res = await webFrame.executeJavaScript(playerBarControlsScript);
  if (typeof res === "function") res();
}

async function hideChromecastButton() {
  await webFrame.executeJavaScript(`
(function() {
        window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_CAST_AVAILABLE', payload: false });
      })()
`);
}

async function hookPlayerApiEvents() {
  const res = await webFrame.executeJavaScript(hookPlayerApiEventsScript);
  if (typeof res === "function") res();
}

function overrideHistoryButtonDisplay() {
  document.querySelector<HTMLElement>("#history-link .history-button")?.setAttribute("style", "display: inline-block !important;");
}

function getYTMTextRun(runs: { text: string }[]) {
  let final = "";
  for (const run of runs) {
    final += run.text;
  }
  return final;
}

async function setupAdSkipper() {
  let adblockEnabled = (await store.get("general")).adblockerEnabled;
  store.onDidAnyChange((newState, oldState) => {
    if (newState.general.adblockerEnabled !== oldState.general.adblockerEnabled) {
      adblockEnabled = newState.general.adblockerEnabled;
    }
  });

  setInterval(() => {
    if (!adblockEnabled) return;
    const skipButton = document.querySelector<HTMLElement>(".ytp-ad-skip-button, .ytp-ad-skip-button-modern");
    if (skipButton) skipButton.click();
    
    const closeButton = document.querySelector<HTMLElement>(".ytp-ad-overlay-close-button");
    if (closeButton) closeButton.click();

    const adShowing = document.querySelector(".ad-showing");
    if (adShowing) {
      const video = document.querySelector("video");
      if (video && !isNaN(video.duration)) {
        video.currentTime = video.duration;
      }
    }
  }, 250);
}

async function setupAutoConfirmKeepPlaying() {
  let autoConfirmEnabled = (await store.get("playback")).autoConfirmKeepPlaying ?? true;
  store.onDidAnyChange((newState, oldState) => {
    if (newState.playback?.autoConfirmKeepPlaying !== oldState.playback?.autoConfirmKeepPlaying) {
      autoConfirmEnabled = newState.playback.autoConfirmKeepPlaying;
    }
  });

  async function resumePlayback() {
    try {
      await webFrame.executeJavaScript(`
        (function() {
          try {
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi) {
              const state = typeof bar.playerApi.getPlayerState === "function" ? bar.playerApi.getPlayerState() : -1;
              if (state === 2) { // 2 = PAUSED
                bar.playerApi.playVideo();
              }
            }
          } catch {
            /* ignore */
          }
        })()
      `);
    } catch {
      /* ignore */
    }
    const video = document.querySelector<HTMLVideoElement>("video");
    if (video && video.paused) {
      video.play().catch(() => {});
    }
  }

  function dismissYouTherePopup() {
    if (!autoConfirmEnabled) return;

    // Sadece YouTube Music "Oynatmaya devam et?" onay pop-up diyaloglarını hedefle
    const youThereRenderers = document.querySelectorAll<HTMLElement>(
      "ytmusic-you-there-renderer, yt-confirm-dialog-renderer"
    );

    let popupFound = false;

    if (youThereRenderers.length > 0) {
      popupFound = true;
      youThereRenderers.forEach(renderer => {
        // 1. Onay butonunu bul ve tıkla (click, pointer, mouse eventleri gönder)
        const confirmBtn = renderer.querySelector<HTMLElement>(
          "#confirm-button button, #button button, #confirm-button, yt-button-renderer button, tp-yt-paper-button, .confirm-button, button#button, button"
        );
        if (confirmBtn) {
          try {
            confirmBtn.click();
            confirmBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true, view: window }));
            confirmBtn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, composed: true, view: window }));
          } catch {
            /* ignore */
          }
        }

        // 2. YouTube Redux / Polymer döngüsünün onayı işlemesine fırsat tanı; ardından dialogu güvenle kapat
        setTimeout(() => {
          type PolymerElement = HTMLElement & { close?: () => void; opened?: boolean };
          const parentDialog = (renderer.closest<HTMLElement>(
            "tp-yt-paper-dialog, paper-dialog, ytmusic-popup-container tp-yt-paper-dialog"
          ) || renderer.parentElement) as PolymerElement | null;

          if (parentDialog) {
            try {
              if (typeof parentDialog.close === "function") {
                parentDialog.close();
              }
              parentDialog.opened = false;
              parentDialog.removeAttribute("opened");
              parentDialog.setAttribute("aria-hidden", "true");
              parentDialog.style.display = "none";
            } catch {
              /* ignore */
            }
          }

          try {
            renderer.style.display = "none";
            renderer.remove();
          } catch {
            /* ignore */
          }
        }, 200);
      });
    }

    // 3. Ekranda açık ve görünür bir dialog yokken arkada kalan sahipsiz backdrop / overlay karartmalarını temizle
    const activeDialogs = Array.from(document.querySelectorAll<HTMLElement>("tp-yt-paper-dialog, paper-dialog")).filter(
      d => d.hasAttribute("opened") && d.style.display !== "none" && !d.querySelector("ytmusic-you-there-renderer, yt-confirm-dialog-renderer")
    );

    if (activeDialogs.length === 0) {
      type PolymerBackdrop = HTMLElement & { close?: () => void; opened?: boolean };
      const backdrops = document.querySelectorAll<PolymerBackdrop>("tp-yt-iron-overlay-backdrop, iron-overlay-backdrop");
      backdrops.forEach(backdrop => {
        try {
          if (typeof backdrop.close === "function") {
            backdrop.close();
          }
          backdrop.opened = false;
          backdrop.removeAttribute("opened");
          backdrop.style.display = "none";
          backdrop.remove();
        } catch {
          /* ignore */
        }
      });
    }

    // 4. Açık kalan ve logonun üzerine binen erişilebilirlik ve ipucu baloncuklarını temizle
    const promoElements = document.querySelectorAll<HTMLElement>(
      "#skip-navigation, a#skip-navigation, ytmusic-bubble-renderer, yt-bubble-hint-renderer, yt-hint-renderer, ytmusic-hint-renderer"
    );
    promoElements.forEach(el => {
      try {
        if (document.activeElement === el || el.contains(document.activeElement)) {
          el.blur?.();
          document.body?.focus();
        }
        el.style.display = "none";
        el.remove();
      } catch {
        /* ignore */
      }
    });

    // 5. Eğer pop-up tespit edildiyse veya duraklatılmışsa oynatmayı sürdür
    if (popupFound) {
      resumePlayback();
    }
  }

  // 1. MutationObserver: Modal DOM'a eklendiği anda sıfır gecikmeyle tetikle
  try {
    const observer = new MutationObserver(mutations => {
      if (!autoConfirmEnabled) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (
              el.tagName?.toLowerCase() === "ytmusic-you-there-renderer" ||
              el.tagName?.toLowerCase() === "yt-confirm-dialog-renderer" ||
              el.tagName?.toLowerCase() === "tp-yt-iron-overlay-backdrop" ||
              el.querySelector?.("ytmusic-you-there-renderer, yt-confirm-dialog-renderer")
            ) {
              dismissYouTherePopup();
              return;
            }
          }
        }
      }
    });

    const targetNode = document.body || document.documentElement;
    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true });
    }
  } catch (e) {
    console.warn("[ENIXM] You-There MutationObserver başlatılamadı:", e);
  }

  // 2. Pencere odaklandığında veya görünür hale geldiğinde ekranda kalan asılı diyalogları temizle (müziği zorla başlatmaz)
  window.addEventListener("focus", () => {
    if (autoConfirmEnabled) {
      dismissYouTherePopup();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && autoConfirmEnabled) {
      dismissYouTherePopup();
    }
  });
  window.addEventListener("resize", () => {
    if (autoConfirmEnabled) dismissYouTherePopup();
  });

  // 3. Arka plan ve yedek koruma için periyodik kontrol (500ms)
  setInterval(() => {
    if (autoConfirmEnabled) {
      dismissYouTherePopup();
    }
  }, 500);
}

// YTM store yakalama — Proxy Store Pattern
// Hemen bir mutable proxy store atanır (hook scriptleri bu referansı alır).
// Gerçek store (ytmusicReduxBehavior vb.) bulunduğunda proxy delegate güncellenir.
//
// AYRICA: customElements.define intercept — custom-elements-es5-adapter.js yüklenmeden
// önce native define kaydedilir. Adapter geldiğinde yakalanır. Sonsuz döngüye giren
// ytmusic-menu-service-item-renderer gibi elemanlar için adapter atlanır.
(async function () {
  await webFrame.executeJavaScript(`
(function() {
      // ─── BÖLÜM 1: customElements.define intercept ─────────────────────────────
      // ES5 adapter'ın (custom-elements-es5-adapter.js) modern Custom Elements üzerinde
      // Reflect.construct döngüsüne ve "Maximum call stack size exceeded" hatasına girmesini engellemek için
      // doğrudan native define fonksiyonunu kullanıyoruz.
      let _nativeDefine = null;
      try {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        const parent = document.head || document.documentElement || document.body;
        if (parent) {
          parent.appendChild(iframe);
          _nativeDefine = iframe.contentWindow.CustomElementRegistry.prototype.define;
          parent.removeChild(iframe);
          console.debug("[ENIXM] Temiz native define referansi iframe ile alindi.");
        }
      } catch (e) {
        console.warn("[ENIXM] Iframe ile native define alinamadi:", e.message);
      }

      if (!_nativeDefine && window.customElements) {
        _nativeDefine = CustomElementRegistry.prototype.define;
      }

      function safeDefine(name, cls, options) {
        try {
          if (_nativeDefine) {
            return _nativeDefine.call(customElements, name, cls, options);
          }
        } catch (e) {
          // Zaten tanımlanmışsa veya başka bir durum varsa yut
        }
      }

      if (window.customElements) {
        try {
          Object.defineProperty(customElements, "define", {
            get: () => safeDefine,
            set: () => {
              // Adapter define'ı ezmeye çalıştığında yoksay, native safeDefine kalmaya devam etsin
            },
            configurable: true
          });
          Object.defineProperty(CustomElementRegistry.prototype, "define", {
            get: () => safeDefine,
            set: () => {},
            configurable: true
          });
        } catch (e) {
          window.customElements.define = safeDefine;
        }
      }

      // Mutable proxy store — delegate sonradan set edilir
      const proxyStore = {
        _delegate: null,
        _pendingSubs: [],

        getState() {
          return this._delegate ? this._delegate.getState() : {};
        },
        dispatch(action) {
          return this._delegate ? this._delegate.dispatch(action) : undefined;
        },
        subscribe(cb) {
          if (this._delegate && typeof this._delegate.subscribe === "function") {
            return this._delegate.subscribe(cb);
          }
          this._pendingSubs.push(cb);
          return () => {
            this._pendingSubs = this._pendingSubs.filter(x => x !== cb);
          };
        },

        _connect(realStore) {
          if (!realStore || this._delegate === realStore) return;

          // Eğer subscribe metodu yoksa ve henüz emüle edilmediyse, dispatch metodunu monkey-patch ederek emüle et
          if (typeof realStore.subscribe !== "function" && !realStore.__enixm_emulated_subscribe) {
            realStore.__enixm_emulated_subscribe = true;
            const subscribers = [];
            const originalDispatch = realStore.dispatch;
            let isDispatching = false;
            
            realStore.dispatch = function(...args) {
              const result = originalDispatch.apply(this, args);
              if (!isDispatching) {
                isDispatching = true;
                try {
                  const subs = subscribers.slice();
                  subs.forEach(cb => {
                    try { cb(); } catch (err) {}
                  });
                } finally {
                  isDispatching = false;
                }
              }
              return result;
            };

            realStore.subscribe = function(cb) {
              subscribers.push(cb);
              return () => {
                const idx = subscribers.indexOf(cb);
                if (idx > -1) subscribers.splice(idx, 1);
              };
            };
            console.debug("[ENIXM] Store icin subscribe emulasyonu kuruldu.");
          }

          this._delegate = realStore;
          
          // Önceki subscribe çağrılarını gerçek/emüle edilmiş store'a bağla
          if (typeof realStore.subscribe === "function" && this._pendingSubs.length > 0) {
            const pending = this._pendingSubs.slice();
            this._pendingSubs = [];
            pending.forEach(cb => {
              try {
                realStore.subscribe(cb);
              } catch (e) {
                console.error("[ENIXM] Pending subscribe baglanirken hata:", e);
              }
            });
          }

          console.debug(
            "[ENIXM] Store baglandi:",
            realStore.constructor?.name || "unknown",
            "| getState:", typeof realStore.getState,
            "| subscribe:", typeof realStore.subscribe,
            "| dispatch:", typeof realStore.dispatch
          );
        }
      };

      // Hook'u hemen proxy ile set et — scripter bu referansı alacak
      window.__ENIXM_HOOK__ = { enixmStore: proxyStore };
      console.debug("[ENIXM] Proxy store hazir, gercek store araniyor...");

      // Gerçek store için aday property'ler (diagnostic ile doğrulandı)
      const STORE_CANDIDATES = [
        "ytmusicReduxBehavior",
        "inst",
        "controllerProxy",
        "playerUiService",
        "polymerController"
      ];

      function isFullStore(s) {
        return s != null &&
          typeof s.getState === "function" &&
          typeof s.subscribe === "function";
      }
      
      function isPartialStore(s) {
        return s != null && typeof s.getState === "function" && typeof s.dispatch === "function";
      }

      let _connected = false;
      let _lastPartialKey = null; // Sürekli aynı logu basmamak için

      const interval = setInterval(() => {
        if (_connected) { clearInterval(interval); return; }
        try {
          const app = document.querySelector("ytmusic-app");
          if (!app) return;

          // 1. Önce TAM store (getState + subscribe) ara
          for (const key of STORE_CANDIDATES) {
            try {
              const candidate = app[key];
              if (isFullStore(candidate)) {
                proxyStore._connect(candidate);
                _connected = true;
                clearInterval(interval);
                console.debug("[ENIXM] Tam store bulundu:", key);
                return;
              }
            } catch (e) {}
          }

          // Fallback: app.store tam mı?
          try {
            if (isFullStore(app.store)) {
              proxyStore._connect(app.store);
              _connected = true;
              clearInterval(interval);
              return;
            }
          } catch (e) {}

          // 2. Eğer tam store bulunamadıysa, en azından getState ve dispatch olan bir store ara
          if (!_connected) {
            for (const key of STORE_CANDIDATES) {
              try {
                const candidate = app[key];
                if (isPartialStore(candidate)) {
                  if (_lastPartialKey !== key) {
                    _lastPartialKey = key;
                    console.debug("[ENIXM] Kismi store adayi bulundu, baglaniliyor:", key);
                    proxyStore._connect(candidate);
                  }
                  break;
                }
              } catch (e) {}
            }
          }
        } catch (e) {}
      }, 250);

      // 60sn sonra da bulunamazsa uyar (ama app zaten açık, proxy devam eder)
      setTimeout(() => {
        if (!_connected && !proxyStore._delegate) {
          console.warn("[ENIXM] 60sn sonra hicbir store bulunamadi. Store ozellikleri calismayabilir.");
        }
      }, 60000);

      // ─── BÖLÜM 3: Proaktif You-There / Inactivity Bekçisi ve Kesintisiz Oynatma ───
      // YouTube afk zamanlayıcısını (window._lact) canlı tutarak uyarının hiç çıkmamasını sağlıyoruz
      function touchActivity() {
        try {
          window._lact = Date.now();
          if (window.yt && window.yt.config_) {
            window.yt.config_.LATEST_ACTIVE_TIME = Date.now();
          }
        } catch (e) {}
      }

      touchActivity();
      setInterval(touchActivity, 10000); // Her 10 saniyede bir son aktif zamanı tazele

      // Sentetik hafif kullanıcı etkileşimi (her 30 saniyede bir)
      setInterval(() => {
        try {
          touchActivity();
          const evt = new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: 1,
            clientY: 1
          });
          window.dispatchEvent(evt);
        } catch (e) {}
      }, 30000);

      // Main World seviyesinde buton tıklama, Player API oynatma ve backdrop temizleme bekçisi
      function checkAndHandleYouThereMainWorld() {
        try {
          const youThere = document.querySelector("ytmusic-you-there-renderer, yt-confirm-dialog-renderer");
          if (youThere) {
            const btn = youThere.querySelector("#confirm-button button, yt-button-renderer button, #confirm-button, tp-yt-paper-button, button#button, button");
            if (btn) {
              btn.click();
              btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true, view: window }));
              btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, composed: true, view: window }));
            }
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi && typeof bar.playerApi.playVideo === "function") {
              const pState = typeof bar.playerApi.getPlayerState === "function" ? bar.playerApi.getPlayerState() : -1;
              if (pState === 2) { // 2 = PAUSED
                bar.playerApi.playVideo();
              }
            }
          }

          // Sahipsiz ve aktif bir dialoga ait olmayan backdrop karartmalarını temizle
          const activeDialogs = Array.from(document.querySelectorAll("tp-yt-paper-dialog[opened], paper-dialog[opened]")).filter(
            d => d.style.display !== "none" && !d.querySelector("ytmusic-you-there-renderer, yt-confirm-dialog-renderer")
          );
          if (activeDialogs.length === 0) {
            const backdrops = document.querySelectorAll("tp-yt-iron-overlay-backdrop, iron-overlay-backdrop");
            backdrops.forEach(b => {
              if (b.opened || b.getAttribute("opened") !== null || b.classList.contains("opened")) {
                if (typeof b.close === "function") b.close();
                b.opened = false;
                b.removeAttribute("opened");
                b.style.display = "none";
                b.remove();
              }
            });
          }
        } catch (e) {}
      }

      try {
        const youThereObserver = new MutationObserver(() => {
          checkAndHandleYouThereMainWorld();
        });
        const target = document.documentElement || document.body;
        if (target) {
          youThereObserver.observe(target, { childList: true, subtree: true });
        }
      } catch (e) {}

      setInterval(checkAndHandleYouThereMainWorld, 500);
      console.debug("[ENIXM] Proaktif You-There ve aktivite bekcisi baslatildi.");
    })()
`);
})();

let audioOnlyObserver: MutationObserver | null = null;
let isAudioOnlyEnabled = false;

function applyAudioOnlyMode(enabled: boolean) {
  isAudioOnlyEnabled = enabled;
  const styleId = "enixm-audio-only-style";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;

  if (enabled) {
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        /* Sadece Müzik Modu: Videoyu tamamen gizler, veri ve GPU/CPU tasarrufu sağlar */
        ytmusic-player[playback-mode="ATV_PREFERRED"] #song-video,
        ytmusic-player.video-toggle-force-hide #song-video,
        #song-video.ytmusic-player,
        #song-video.ytmusic-player video,
        ytmusic-player #song-video video {
          display: none !important;
          visibility: hidden !important;
        }
        #song-image,
        ytmusic-player #song-image,
        ytmusic-player #song-image #img {
          display: block !important;
          visibility: visible !important;
        }
        ytmusic-player {
          margin: auto 0px !important;
        }
      `;
      (document.head || document.documentElement || document.body)?.appendChild(style);
    }

    const player = document.querySelector("ytmusic-player");
    if (player) {
      player.classList.add("video-toggle-force-hide");
      if (player.getAttribute("playback-mode") !== "ATV_PREFERRED") {
        player.setAttribute("playback-mode", "ATV_PREFERRED");
      }
    }

    const songVideo = document.querySelector<HTMLElement>("#song-video.ytmusic-player");
    if (songVideo) songVideo.style.display = "none";
    const songImage = document.querySelector<HTMLElement>("#song-image");
    if (songImage) songImage.style.display = "block";

    if (!audioOnlyObserver && player) {
      audioOnlyObserver = new MutationObserver((mutations) => {
        if (!isAudioOnlyEnabled) return;
        for (const m of mutations) {
          if (m.type === "attributes" && m.attributeName === "playback-mode") {
            const target = m.target as HTMLElement;
            if (target.getAttribute("playback-mode") !== "ATV_PREFERRED") {
              target.setAttribute("playback-mode", "ATV_PREFERRED");
            }
          }
        }
      });
      audioOnlyObserver.observe(player, { attributes: true, attributeFilter: ["playback-mode"] });
    }

    webFrame.executeJavaScript(`
      (function() {
        const p = document.querySelector("ytmusic-player");
        if (p) {
          p.setAttribute("playback-mode", "ATV_PREFERRED");
          p.classList.add("video-toggle-force-hide");
        }
        const v = document.querySelector("#song-video.ytmusic-player");
        if (v) v.style.display = "none";
        const img = document.querySelector("#song-image");
        if (img) img.style.display = "block";
      })()
    `).catch(() => {});
  } else {
    if (audioOnlyObserver) {
      audioOnlyObserver.disconnect();
      audioOnlyObserver = null;
    }
    if (style) {
      style.remove();
    }
    const player = document.querySelector("ytmusic-player");
    if (player) {
      player.classList.remove("video-toggle-force-hide");
      player.setAttribute("playback-mode", "OMV_PREFERRED");
    }
    const songVideo = document.querySelector<HTMLElement>("#song-video.ytmusic-player");
    if (songVideo) songVideo.style.display = "";
    const songImage = document.querySelector<HTMLElement>("#song-image");
    if (songImage) songImage.style.display = "";

    webFrame.executeJavaScript(`
      (function() {
        const p = document.querySelector("ytmusic-player");
        if (p) {
          p.setAttribute("playback-mode", "OMV_PREFERRED");
          p.classList.remove("video-toggle-force-hide");
        }
        const v = document.querySelector("#song-video.ytmusic-player");
        if (v) v.style.display = "";
        const img = document.querySelector("#song-image");
        if (img) img.style.display = "";
      })()
    `).catch(() => {});
  }
}

let dislikeObserver: MutationObserver | null = null;
let dislikePollTimer: ReturnType<typeof setInterval> | null = null;

function setupSkipDislikedSongs(enabled: boolean) {
  if (dislikeObserver) {
    dislikeObserver.disconnect();
    dislikeObserver = null;
  }
  if (dislikePollTimer) {
    clearInterval(dislikePollTimer);
    dislikePollTimer = null;
  }
  if (!enabled) return;

  const triggerNext = () => {
    webFrame.executeJavaScript(`
      (function() {
        const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
        if (bar && bar.playerApi && typeof bar.playerApi.nextVideo === "function") {
          bar.playerApi.nextVideo();
        } else {
          const nextBtn = document.querySelector(".next-button, #next-button, tp-yt-paper-icon-button.next-button");
          if (nextBtn) nextBtn.click();
        }
      })()
    `).catch(() => {});
  };

  const checkDislike = () => {
    const likeRenderer = document.querySelector("#like-button-renderer");
    if (likeRenderer && likeRenderer.getAttribute("like-status") === "DISLIKE") {
      triggerNext();
      return true;
    }
    return false;
  };

  const attachObserver = () => {
    const likeRenderer = document.querySelector("#like-button-renderer");
    if (!likeRenderer) return false;

    checkDislike();

    dislikeObserver = new MutationObserver(() => {
      checkDislike();
    });
    dislikeObserver.observe(likeRenderer, {
      attributes: true,
      attributeFilter: ["like-status"]
    });
    return true;
  };

  if (!attachObserver()) {
    dislikePollTimer = setInterval(() => {
      if (attachObserver()) {
        if (dislikePollTimer) {
          clearInterval(dislikePollTimer);
          dislikePollTimer = null;
        }
      }
    }, 1000);
  }
}

let mouseWheelVolumeListener: ((event: WheelEvent) => void) | null = null;

function setupMouseWheelVolume(enabled: boolean) {
  if (mouseWheelVolumeListener) {
    window.removeEventListener("wheel", mouseWheelVolumeListener, { capture: true });
    mouseWheelVolumeListener = null;
  }
  if (!enabled) return;

  mouseWheelVolumeListener = (event: WheelEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const isPlayer = target.closest("ytmusic-player-bar, #player-page, ytmusic-player, #main-panel");
    if (!isPlayer) return;

    event.preventDefault();
    const isUp = event.deltaY < 0;
    webFrame.executeJavaScript(`
      (function() {
        const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
        if (bar && bar.playerApi && typeof bar.playerApi.getVolume === "function" && typeof bar.playerApi.setVolume === "function") {
          const cur = bar.playerApi.getVolume();
          const step = 5;
          const next = Math.max(0, Math.min(100, cur + (${isUp ? "step" : "-step"})));
          bar.playerApi.setVolume(next);
          if (window.__ENIXM_HOOK__ && window.__ENIXM_HOOK__.enixmStore) {
            window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_VOLUME', payload: next });
          }
        }
      })()
    `).catch(() => {});
  };

  window.addEventListener("wheel", mouseWheelVolumeListener, { capture: true, passive: false });
}

let silenceDetectionEnabled = false;
let silenceAudioContext: AudioContext | null = null;
let silenceAnalyser: AnalyserNode | null = null;
let silenceSourceNode: MediaElementAudioSourceNode | null = null;
let silenceCheckInterval: ReturnType<typeof setInterval> | null = null;

function setupSkipSilences(enabled: boolean) {
  silenceDetectionEnabled = enabled;
  if (!enabled) {
    if (silenceCheckInterval) {
      clearInterval(silenceCheckInterval);
      silenceCheckInterval = null;
    }
    return;
  }

  const startSilenceDetection = () => {
    const video = document.querySelector<HTMLVideoElement>("video");
    if (!video) return false;

    if (!silenceAudioContext) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;
        silenceAudioContext = new AudioCtx();
        silenceSourceNode = silenceAudioContext.createMediaElementSource(video);
        silenceAnalyser = silenceAudioContext.createAnalyser();
        silenceAnalyser.fftSize = 512;
        silenceAnalyser.smoothingTimeConstant = 0.1;

        silenceSourceNode.connect(silenceAnalyser);
        silenceAnalyser.connect(silenceAudioContext.destination);
      } catch (e) {
        console.warn("[ENIXM] setupSkipSilences AudioContext:", e);
        return false;
      }
    }

    if (silenceAudioContext.state === "suspended") {
      const resume = () => {
        silenceAudioContext?.resume();
      };
      video.addEventListener("play", resume, { once: true });
    }

    if (silenceCheckInterval) clearInterval(silenceCheckInterval);

    const fftBins = new Float32Array(silenceAnalyser.frequencyBinCount);
    const threshold = -90; // dB
    let silentTicks = 0;

    silenceCheckInterval = setInterval(() => {
      if (!silenceDetectionEnabled || !silenceAnalyser || !video) return;
      if (video.paused || video.seeking || video.ended || video.muted || video.volume === 0) {
        silentTicks = 0;
        return;
      }

      silenceAnalyser.getFloatFrequencyData(fftBins);
      let maxVolume = Number.NEGATIVE_INFINITY;
      for (let i = 4; i < fftBins.length; i++) {
        if (fftBins[i] > maxVolume && fftBins[i] < 0) {
          maxVolume = fftBins[i];
        }
      }

      if (maxVolume < threshold) {
        silentTicks++;
        // 300ms'den uzun sessizlik durumunda 0.25 sn ileri sar
        if (silentTicks >= 6) {
          video.currentTime += 0.25;
        }
      } else {
        silentTicks = 0;
      }
    }, 50);

    return true;
  };

  if (!startSilenceDetection()) {
    const videoWait = setInterval(() => {
      if (startSilenceDetection()) {
        clearInterval(videoWait);
      }
    }, 1000);
  }
}

async function initEnixMView() {
  try {
    const hostname = window.location.hostname;
  if (hostname !== "music.youtube.com") {
    if (
      hostname === "consent.youtube.com" ||
      hostname === "consent.google.com" ||
      hostname.includes("google.") ||
      hostname.includes("youtube.")
    ) {
      ipcRenderer.send("enixmView:loaded");
    }
    return;
  }

  try {
    await new Promise<void>(resolve => {
      let count = 0;
      const interval = setInterval(async () => {
        count++;
        let hooked = false;
        try {
          hooked = await webFrame.executeJavaScript(`
            (function() {
              return !!window.__ENIXM_HOOK__;
            })()
          `);
        } catch {
          hooked = false;
        }

        if (hooked || count > 12) {
          clearInterval(interval);
          resolve();
        }
      }, 250);
    });
  } catch {
    /* ignore */
  }

  try { setupAdSkipper(); } catch { /* ignore */ }
  try { setupAutoConfirmKeepPlaying(); } catch { /* ignore */ }

  let materialSymbolsLoaded = false;
  try {
    const materialSymbols = createMaterialSymbolsLink();
    materialSymbols.onload = () => {
      materialSymbolsLoaded = true;
    };
    materialSymbols.onerror = () => {
      materialSymbolsLoaded = true;
    };
    document.head.appendChild(materialSymbols);
  } catch {
    materialSymbolsLoaded = true;
  }

  try {
    await new Promise<void>(resolve => {
      let count = 0;
      const interval = setInterval(async () => {
        count++;
        let playerApiReady = false;
        try {
          playerApiReady = await webFrame.executeJavaScript(`
            (function() {
              const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
              return !!(bar && bar.playerApi && bar.playerApi.isReady && bar.playerApi.isReady());
            })()
          `);
        } catch {
          playerApiReady = false;
        }

        if ((materialSymbolsLoaded && playerApiReady) || count > 12) {
          clearInterval(interval);
          resolve();
        }
      }, 250);
    });
  } catch {
    /* ignore */
  }

  try { createStyleSheet(); } catch (e) { console.warn("[ENIXM] createStyleSheet:", e); }
  try { createNavigationMenuArrows(); } catch (e) { console.warn("[ENIXM] createNavigationMenuArrows:", e); }
  try { createKeyboardNavigation(); } catch (e) { console.warn("[ENIXM] createKeyboardNavigation:", e); }
  try { await createAdditionalPlayerBarControls(); } catch (e) { console.warn("[ENIXM] createAdditionalPlayerBarControls:", e); }
  try { await hideChromecastButton(); } catch (e) { console.warn("[ENIXM] hideChromecastButton:", e); }
  try { await hookPlayerApiEvents(); } catch (e) { console.warn("[ENIXM] hookPlayerApiEvents:", e); }
  try { overrideHistoryButtonDisplay(); } catch (e) { console.warn("[ENIXM] overrideHistoryButtonDisplay:", e); }

  const integrationScripts: { [integrationName: string]: { [scriptName: string]: string } } = await ipcRenderer.invoke("enixmView:getIntegrationScripts");

  const state = await store.get("state");
  const continueWhereYouLeftOff = (await store.get("playback")).continueWhereYouLeftOff;
  const continueWhereYouLeftOffPaused = (await store.get("playback")).continueWhereYouLeftOffPaused;

  const ensureInitialPause = () => {
    if (!continueWhereYouLeftOffPaused) return;

    let userInteracted = false;
    let initialPaused = false;

    // Kullanıcı Play tuşuna bastığında veya sayfayla etkileşime girdiğinde initial pause'u tamamen iptal et
    const onUserInteraction = () => {
      userInteracted = true;
      cleanup();
    };

    window.addEventListener("pointerdown", onUserInteraction, { capture: true, once: true });
    window.addEventListener("keydown", onUserInteraction, { capture: true, once: true });

    const stopPlayback = () => {
      if (userInteracted || initialPaused) return;

      const video = document.querySelector<HTMLVideoElement>("video");
      type YTMPlayerBarElement = HTMLElement & {
        playerApi?: {
          getPlayerState?: () => number;
          pauseVideo?: () => void;
        };
      };
      const playerBar = document.querySelector<YTMPlayerBarElement>("ytmusic-app-layout ytmusic-player-bar");

      let didPause = false;

      if (playerBar && playerBar.playerApi) {
        const pState = playerBar.playerApi.getPlayerState ? playerBar.playerApi.getPlayerState() : -1;
        // 1 = PLAYING, 3 = BUFFERING
        if (pState === 1 || pState === 3) {
          playerBar.playerApi.pauseVideo();
          didPause = true;
        }
      }

      if (video && !video.paused) {
        video.pause();
        didPause = true;
      }

      if (didPause) {
        initialPaused = true;
        cleanup();
      }
    };

    const cleanup = () => {
      if (pauseInterval) {
        clearInterval(pauseInterval);
        pauseInterval = null;
      }
      window.removeEventListener("pointerdown", onUserInteraction, { capture: true });
      window.removeEventListener("keydown", onUserInteraction, { capture: true });
    };

    let attempts = 0;
    let pauseInterval: NodeJS.Timeout | null = setInterval(() => {
      attempts++;
      stopPlayback();
      if (attempts > 30 || initialPaused || userInteracted) {
        cleanup();
      }
    }, 100);
  };

      if (continueWhereYouLeftOff) {
    // The last page the user was on is already a page where it will be playing a song from (no point telling YTM to play it again)
    if (!state.lastUrl.startsWith("https://music.youtube.com/watch")) {
      if (state.lastVideoId) {
        // This height transition check is a hack to fix the `Start playback` hint from not being in the correct position https://github.com/enixyazilim/issues/5
        let heightTransitionCount = 0;
        const transitionEnd = async (e: TransitionEvent) => {
          if (e.target === document.querySelector("ytmusic-app-layout>ytmusic-player-bar")) {
            if (e.propertyName === "height") {
              await webFrame.executeJavaScript(`
                (function() {
                  document.querySelector("ytmusic-popup-container").refitPopups_();
                })()
              `);
              heightTransitionCount++;
              if (heightTransitionCount >= 2) {
                document.querySelector("ytmusic-app-layout>ytmusic-player-bar").removeEventListener("transitionend", transitionEnd);
              }
            }
          }
        };
        document.querySelector("ytmusic-app-layout>ytmusic-player-bar").addEventListener("transitionend", transitionEnd);

        document.dispatchEvent(
          new CustomEvent("yt-navigate", {
            detail: {
              endpoint: {
                watchEndpoint: {
                  videoId: state.lastVideoId,
                  playlistId: state.lastPlaylistId
                }
              }
            }
          })
        );
        ensureInitialPause();
      }
    } else {
      await webFrame.executeJavaScript(`
(function() {
            const playerBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (playerBar && playerBar.playerApi) {
              const resp = playerBar.playerApi.getPlayerResponse();
              if (resp && resp.videoDetails) {
                window.enixm.sendVideoData(resp.videoDetails, playerBar.playerApi.getPlaylistId());
              }
            }
          })()
`);
      ensureInitialPause();
    }
  }

  try {
    const appearance = await store.get("appearance");
    if (appearance?.alwaysShowVolumeSlider) {
      document.querySelector("ytmusic-app-layout>ytmusic-player-bar #volume-slider")?.classList?.add("enixm-persist-volume-slider");
    }
    setupMouseWheelVolume(appearance?.mouseWheelVolume ?? false);

    const playback = await store.get("playback");
    applyAudioOnlyMode(playback?.audioOnlyMode ?? false);
    setupSkipDislikedSongs(playback?.skipDislikedSongs ?? false);
    setupSkipSilences(playback?.skipSilences ?? false);
  } catch {
    /* ignore */
  }

  ipcRenderer.on("remoteControl:execute", async (_event, command, value) => {
    switch (command) {
      case "playPause": {
        await webFrame.executeJavaScript(`
          (function() {
            const playPauseBtn = document.querySelector("#play-pause-button, tp-yt-paper-icon-button#play-pause-button, button#play-pause-button");
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            const video = document.querySelector("video");

            if (playPauseBtn) {
              playPauseBtn.click();
              return;
            }
            if (bar && bar.playerApi && typeof bar.playerApi.getPlayerState === "function") {
              if (bar.playerApi.getPlayerState() === 1) {
                bar.playerApi.pauseVideo();
              } else {
                bar.playerApi.playVideo();
              }
              return;
            }
            if (video) {
              video.paused ? video.play() : video.pause();
            }
          })()
        `);
        break;
      }

      case "play": {
        await webFrame.executeJavaScript(`
          (function() {
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            const video = document.querySelector("video");
            if (bar && bar.playerApi && typeof bar.playerApi.playVideo === "function") {
              bar.playerApi.playVideo();
            } else if (video && video.paused) {
              video.play();
            }
          })()
        `);
        break;
      }

      case "pause": {
        await webFrame.executeJavaScript(`
          (function() {
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            const video = document.querySelector("video");
            if (bar && bar.playerApi && typeof bar.playerApi.pauseVideo === "function") {
              bar.playerApi.pauseVideo();
            } else if (video && !video.paused) {
              video.pause();
            }
          })()
        `);
        break;
      }

      case "next": {
        await webFrame.executeJavaScript(`
          (function() {
            const nextBtn = document.querySelector(".next-button, #next-button, tp-yt-paper-icon-button.next-button");
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi && typeof bar.playerApi.nextVideo === "function") {
              bar.playerApi.nextVideo();
            } else if (nextBtn) {
              nextBtn.click();
            }
          })()
        `);
        break;
      }

      case "previous": {
        await webFrame.executeJavaScript(`
          (function() {
            const prevBtn = document.querySelector(".previous-button, #previous-button, tp-yt-paper-icon-button.previous-button");
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi && typeof bar.playerApi.previousVideo === "function") {
              bar.playerApi.previousVideo();
            } else if (prevBtn) {
              prevBtn.click();
            }
          })()
        `);
        break;
      }

      case "toggleLike": {
        const res = await webFrame.executeJavaScript(toggleLikeScript);
        if (typeof res === "function") res();
        break;
      }

      case "toggleDislike": {
        const res = await webFrame.executeJavaScript(toggleDislikeScript);
        if (typeof res === "function") res();
        break;
      }

      case "volumeUp": {
        let currentVolumeUp = 0;
        try {
          currentVolumeUp = await webFrame.executeJavaScript(`
            (function() {
              const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
              return (bar && bar.playerApi && bar.playerApi.getVolume) ? bar.playerApi.getVolume() : 0;
            })()
          `);
        } catch {
          /* ignore */
        }

        let newVolumeUp = currentVolumeUp + 10;
        if (newVolumeUp > 100) newVolumeUp = 100;

        await webFrame.executeJavaScript(`
          (function() {
            const vol = ${newVolumeUp};
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi) bar.playerApi.setVolume(vol);
            if (window.__ENIXM_HOOK__ && window.__ENIXM_HOOK__.enixmStore) {
              window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_VOLUME', payload: vol });
            }
          })()
        `);
        break;
      }

      case "volumeDown": {
        let currentVolumeDown = 0;
        try {
          currentVolumeDown = await webFrame.executeJavaScript(`
            (function() {
              const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
              return (bar && bar.playerApi && bar.playerApi.getVolume) ? bar.playerApi.getVolume() : 0;
            })()
          `);
        } catch {
          /* ignore */
        }

        let newVolumeDown = currentVolumeDown - 10;
        if (newVolumeDown < 0) newVolumeDown = 0;

        await webFrame.executeJavaScript(`
          (function() {
            const vol = ${newVolumeDown};
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi) bar.playerApi.setVolume(vol);
            if (window.__ENIXM_HOOK__ && window.__ENIXM_HOOK__.enixmStore) {
              window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_VOLUME', payload: vol });
            }
          })()
        `);
        break;
      }

      case "setVolume": {
        const valueInt: number = parseInt(value);
        if (isNaN(valueInt) || valueInt < 0 || valueInt > 100) return;

        await webFrame.executeJavaScript(`
          (function() {
            const vol = ${valueInt};
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi) bar.playerApi.setVolume(vol);
            if (window.__ENIXM_HOOK__ && window.__ENIXM_HOOK__.enixmStore) {
              window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_VOLUME', payload: vol });
            }
          })()
        `);
        break;
      }

      case "mute":
        await webFrame.executeJavaScript(`
          (function() {
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi) bar.playerApi.mute();
            if (window.__ENIXM_HOOK__ && window.__ENIXM_HOOK__.enixmStore) {
              window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_MUTED', payload: true });
            }
          })()
        `);
        break;

      case "unmute":
        await webFrame.executeJavaScript(`
          (function() {
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi) bar.playerApi.unMute();
            if (window.__ENIXM_HOOK__ && window.__ENIXM_HOOK__.enixmStore) {
              window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_MUTED', payload: false });
            }
          })()
        `);
        break;

      case "repeatMode":
        await webFrame.executeJavaScript(`
          (function() {
            const mode = ${JSON.stringify(value)};
            if (window.__ENIXM_HOOK__ && window.__ENIXM_HOOK__.enixmStore) {
              window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_REPEAT', payload: mode });
            }
          })()
        `);
        break;

      case "seekTo":
        await webFrame.executeJavaScript(`
          (function() {
            const pos = ${JSON.stringify(value)};
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.playerApi) bar.playerApi.seekTo(pos);
          })()
        `);
        break;

      case "shuffle":
        await webFrame.executeJavaScript(`
          (function() {
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            if (bar && bar.queue) bar.queue.shuffle();
          })()
        `);
        break;

      case "playQueueIndex": {
        const indexInt: number = parseInt(value);
        await webFrame.executeJavaScript(`
          (function() {
            let index = ${indexInt};
            const state = window.__ENIXM_HOOK__.enixmStore.getState();
            const queue = state ? state.queue : null;
            if (!queue || !queue.items) return;

            const maxQueueIndex = queue.items.length - 1;
            let useAutoMix = false;
            if (index > maxQueueIndex) {
              index = index - queue.items.length;
              useAutoMix = true;
            }

            let song = !useAutoMix ? queue.items[index] : (queue.automixItems ? queue.automixItems[index] : null);
            if (!song) return;

            let playlistPanelVideoRenderer;
            if (song.playlistPanelVideoRenderer) {
              playlistPanelVideoRenderer = song.playlistPanelVideoRenderer;
            } else if (song.playlistPanelVideoWrapperRenderer) {
              playlistPanelVideoRenderer = song.playlistPanelVideoWrapperRenderer.primaryRenderer.playlistPanelVideoRenderer;
            }

            if (playlistPanelVideoRenderer && playlistPanelVideoRenderer.navigationEndpoint) {
              document.dispatchEvent(
                new CustomEvent("yt-navigate", {
                  detail: {
                    endpoint: {
                      watchEndpoint: playlistPanelVideoRenderer.navigationEndpoint.watchEndpoint
                    }
                  }
                })
              );
            }
          })()
        `);
        break;
      }

      case "seekBy": {
        const delta = Number(value) || 0;
        await webFrame.executeJavaScript(`
          (function() {
            const video = document.querySelector("video");
            if (video) {
              video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + (${delta})));
            }
          })()
        `);
        break;
      }

      case "switchRepeat": {
        await webFrame.executeJavaScript(`
          (function() {
            const bar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
            const repeatBtn = document.querySelector(".repeat, #repeat-button, ytmusic-player-bar .repeat");
            if (repeatBtn) {
              repeatBtn.click();
            } else if (bar && bar.playerApi && typeof bar.playerApi.nextRepeatMode === "function") {
              bar.playerApi.nextRepeatMode();
            }
          })()
        `);
        break;
      }

      case "navigate": {
        const endpoint = value;
        document.dispatchEvent(
          new CustomEvent("yt-navigate", {
            detail: {
              endpoint
            }
          })
        );
        break;
      }
    }
  });

  ipcRenderer.on("enixmView:getPlaylists", async (_event, requestId) => {
    const fn = await webFrame.executeJavaScript(getPlaylistsScript);
    const rawPlaylists = typeof fn === "function" ? await fn() : fn;

    const playlists = [];
    if (Array.isArray(rawPlaylists)) {
      for (const rawPlaylist of rawPlaylists) {
        const playlist = rawPlaylist.playlistAddToOptionRenderer;
        if (playlist) {
          playlists.push({
            id: playlist.playlistId,
            title: getYTMTextRun(playlist.title.runs)
          });
        }
      }
    }
    ipcRenderer.send(`enixmView:getPlaylists:response:${requestId}`, playlists);
  });

  store.onDidAnyChange(newState => {
    try {
      const volumeSlider = document.querySelector("#volume-slider");
      if (volumeSlider) {
        if (newState?.appearance?.alwaysShowVolumeSlider) {
          if (!volumeSlider.classList.contains("enixm-persist-volume-slider")) {
            volumeSlider.classList.add("enixm-persist-volume-slider");
          }
        } else {
          if (volumeSlider.classList.contains("enixm-persist-volume-slider")) {
            volumeSlider.classList.remove("enixm-persist-volume-slider");
          }
        }
      }

      if (newState?.appearance?.mouseWheelVolume !== undefined) {
        setupMouseWheelVolume(newState.appearance.mouseWheelVolume);
      }

      if (newState?.playback?.audioOnlyMode !== undefined) {
        applyAudioOnlyMode(newState.playback.audioOnlyMode);
      }

      if (newState?.playback?.skipDislikedSongs !== undefined) {
        setupSkipDislikedSongs(newState.playback.skipDislikedSongs);
      }

      if (newState?.playback?.skipSilences !== undefined) {
        setupSkipSilences(newState.playback.skipSilences);
      }
    } catch {
      /* ignore */
    }
  });

  document.addEventListener("yt-navigate-finish", async () => {
    try {
      const playback = await store.get("playback");
      if (playback?.audioOnlyMode) {
        applyAudioOnlyMode(true);
      }
    } catch {
      /* ignore */
    }
  });

  ipcRenderer.on("enixmView:refitPopups", async () => {
    // Update 4/14/2024: Broken until a hook is provided for this
    /*
    (
      await webFrame.executeJavaScript(`
        (function() {
          document.querySelector("ytmusic-popup-container").refitPopups_();
        })
`);
    */
  });

  ipcRenderer.on("enixmView:executeScript", async (_event, integrationName, scriptName) => {
    const scripts = integrationScripts[integrationName];
    if (scripts) {
      const script = scripts[scriptName];
      if (script) {
        try {
          const res = await webFrame.executeJavaScript(script);
          if (typeof res === "function") {
            res();
          }
        } catch (e) {
          console.error("[ENIXM] executeScript hatası:", integrationName, scriptName, e);
        }
      }
    }
  });

  ipcRenderer.send("enixmView:loaded");
  } catch (err) {
    console.error("[ENIXM] initEnixMView genel hata:", err);
    ipcRenderer.send("enixmView:loaded");
  }
}

let hasInitTriggered = false;
function triggerInit() {
  if (hasInitTriggered) return;
  hasInitTriggered = true;
  initEnixMView().catch(err => {
    console.error("[ENIXM] triggerInit hatasi:", err);
    ipcRenderer.send("enixmView:loaded");
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  triggerInit();
} else {
  window.addEventListener("DOMContentLoaded", triggerInit, { once: true });
  window.addEventListener("load", triggerInit, { once: true });
}

// Guvenlik zaman asimi: Ne olursa olsun en gec 4 saniye sonra triggerInit calissin
setTimeout(() => {
  if (!hasInitTriggered) {
    triggerInit();
  }
}, 4000);
