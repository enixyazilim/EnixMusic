(function () {
  try {
    const enixmStore = window.__ENIXM_HOOK__?.enixmStore;

    function sendStoreState() {
      try {
        if (!enixmStore) return;
        const state = enixmStore.getState() || {};

        const playerBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
        const playerResponse = playerBar?.playerApi?.getPlayerResponse?.();
        const videoId = playerResponse?.videoDetails?.videoId;

        const likeButton = playerBar?.querySelector?.("ytmusic-like-button-renderer");
        const defaultLikeStatus = likeButton?.data?.likeStatus ?? "UNKNOWN";
        const storeLikeStatus = videoId && state?.likeStatus?.videos ? state.likeStatus.videos[videoId] : null;

        const likeStatus = storeLikeStatus ? storeLikeStatus : defaultLikeStatus;
        const volume = state?.player?.volume ?? 0;
        const adPlaying = !!state?.player?.adPlaying;
        const muted = !!state?.player?.muted;

        if (window.enixm?.sendStoreUpdate) {
          window.enixm.sendStoreUpdate(state.queue, likeStatus, volume, muted, adPlaying);
        }
      } catch (err) {
        console.warn("[ENIXM] sendStoreState hatasi:", err);
      }
    }

    let isHooked = false;

    function hookVideoElement() {
      try {
        const video = document.querySelector("video");
        if (!video || video.__enixm_hooked) return;
        video.__enixm_hooked = true;

        const updateFromVideo = () => {
          try {
            if (!video.paused && !video.ended) {
              window.enixm?.sendVideoState(1); // 1 = Playing
            } else if (video.paused) {
              window.enixm?.sendVideoState(2); // 2 = Paused
            }
          } catch (e) {}
        };

        video.addEventListener("play", updateFromVideo);
        video.addEventListener("playing", updateFromVideo);
        video.addEventListener("pause", updateFromVideo);
        video.addEventListener("ended", () => {
          try {
            window.enixm?.sendVideoState(0);
          } catch (e) {}
        });

        updateFromVideo();
      } catch (err) {
        console.warn("[ENIXM] hookVideoElement hatasi:", err);
      }
    }

    function sendCurrentVideoData(playerBar, playerApi) {
      try {
        const resp = playerApi?.getPlayerResponse?.();
        let videoDetails = resp?.videoDetails;
        if (!videoDetails) return;

        let playlistId = typeof playerApi?.getPlaylistId === "function" ? playerApi.getPlaylistId() : "";
        let album = null;
        let hasFullMetadata = false;

        let currentItem = playerBar?.currentItem;
        if (currentItem !== null && currentItem !== undefined) {
          hasFullMetadata = true;

          if (Array.isArray(currentItem.title?.runs)) {
            videoDetails.title = currentItem.title.runs.map(v => v.text).join("");
          }
          if (currentItem.thumbnail) {
            videoDetails.thumbnail = currentItem.thumbnail;
          }

          const runs = currentItem.longBylineText?.runs;
          if (Array.isArray(runs)) {
            for (let i = 0; i < runs.length; i++) {
              const item = runs[i];
              if (item?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType === "MUSIC_PAGE_TYPE_ALBUM") {
                album = {
                  id: item.navigationEndpoint.browseEndpoint.browseId,
                  text: item.text
                };
                break;
              }
            }
          }
        }

        const state = enixmStore?.getState?.() || {};
        const likeButtonData = playerBar?.querySelector?.("ytmusic-like-button-renderer")?.data;
        const defaultLikeStatus = likeButtonData?.likeStatus ?? "UNKNOWN";
        const storeLikeStatus = state?.likeStatus?.videos?.[videoDetails.videoId];
        const likeStatus = storeLikeStatus ? storeLikeStatus : defaultLikeStatus;

        window.enixm?.sendVideoData(videoDetails, playlistId, album, likeStatus, hasFullMetadata);
      } catch (err) {
        console.warn("[ENIXM] sendCurrentVideoData hatasi:", err);
      }
    }

    function tryHookPlayerApi() {
      hookVideoElement();

      if (isHooked) return true;

      try {
        const playerBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
        if (!playerBar || !playerBar.playerApi || typeof playerBar.playerApi.addEventListener !== "function") {
          return false;
        }

        const playerApi = playerBar.playerApi;

        playerApi.addEventListener("onVideoProgress", progress => {
          try {
            window.enixm?.sendVideoProgress(progress);
          } catch (e) {}
        });

        playerApi.addEventListener("onStateChange", state => {
          try {
            window.enixm?.sendVideoState(state);
          } catch (e) {}
        });

        playerApi.addEventListener("onVideoDataChange", event => {
          try {
            if (event?.type === "dataloaded" || event?.type === "dataupdated" || event?.playertype === 1) {
              sendCurrentVideoData(playerBar, playerApi);
            }
          } catch (err) {
            console.warn("[ENIXM] onVideoDataChange hatasi:", err);
          }
        });

        // Send initial state & video data immediately upon hook
        try {
          const currentState = typeof playerApi.getPlayerState === "function" ? playerApi.getPlayerState() : -1;
          if (currentState !== -1) {
            window.enixm?.sendVideoState(currentState);
          }
        } catch (e) {}

        sendCurrentVideoData(playerBar, playerApi);

        isHooked = true;
        console.debug("[ENIXM] PlayerApi basariyla hooklandi.");
        return true;
      } catch (err) {
        console.warn("[ENIXM] tryHookPlayerApi hatasi:", err);
        return false;
      }
    }

    // İlk deneme ve periyodik hook kontrolleri
    if (!tryHookPlayerApi()) {
      let attempts = 0;
      const hookInterval = setInterval(() => {
        attempts++;
        hookVideoElement();
        if (tryHookPlayerApi() || attempts > 60) {
          clearInterval(hookInterval);
        }
      }, 500);
    } else {
      hookVideoElement();
    }

    setInterval(() => {
      hookVideoElement();
    }, 2000);

    if (enixmStore?.subscribe) {
      enixmStore.subscribe(() => {
        sendStoreState();
      });
    }

    window.addEventListener("yt-action", e => {
      try {
        if (!e?.detail) return;
        if (e.detail.actionName === "yt-service-request") {
          if (e.detail.args?.[1]?.createPlaylistServiceEndpoint) {
            const title = e.detail.args[2]?.create_playlist_title;
            const returnValue = e.detail.returnValue;
            if (returnValue?.[0]?.ajaxPromise) {
              returnValue[0].ajaxPromise.then(response => {
                const id = response?.data?.playlistId;
                window.enixm?.sendCreatePlaylistObservation({ title, id });
              }).catch(() => {});
            }
          }
        } else if (e.detail.actionName === "yt-handle-playlist-deletion-command") {
          const playlistId = e.detail.args?.[0]?.handlePlaylistDeletionCommand?.playlistId;
          if (playlistId) {
            window.enixm?.sendDeletePlaylistObservation(playlistId);
          }
        }
      } catch (err) {
        console.warn("[ENIXM] yt-action handler hatasi:", err);
      }
    });
  } catch (outerErr) {
    console.warn("[ENIXM] hookplayerapievents genel hata:", outerErr);
  }
})();
