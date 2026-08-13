(function() {
  const enixmStore = window.__ENIXM_HOOK__.enixmStore;

  function sendStoreState() {
    // We don't want to see everything in the store as there can be some sensitive data so we only send what's necessary to operate
    let state = enixmStore.getState();

    const videoId = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.getPlayerResponse()?.videoDetails?.videoId;
    const likeButtonData = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").querySelector("ytmusic-like-button-renderer").data;
    const defaultLikeStatus = likeButtonData?.likeStatus ?? "UNKNOWN";
    const storeLikeStatus = state.likeStatus.videos[videoId];
    
    const likeStatus = storeLikeStatus ? state.likeStatus.videos[videoId] : defaultLikeStatus;
    const volume = state.player.volume;
    const adPlaying = state.player.adPlaying;
    const muted = state.player.muted;

    window.enixm.sendStoreUpdate(state.queue, likeStatus, volume, muted, adPlaying);
  }

  document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.addEventListener("onVideoProgress", progress => {
    window.enixm.sendVideoProgress(progress);
  });
  document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.addEventListener("onStateChange", state => {
    window.enixm.sendVideoState(state);
  });
  document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.addEventListener("onVideoDataChange", event => {
    if (event.playertype === 1 && (event.type === "dataloaded" || event.type === "dataupdated")) {
      let videoDetails = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.getPlayerResponse().videoDetails;
      let playlistId = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.getPlaylistId();
      let album = null;
      let hasFullMetadata = false;

      // If playing from online sources this usually is filled out with the first dataupdated which is followed after dataloaded. While offline this is always filled
      let currentItem = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").currentItem;
      if (currentItem !== null && currentItem !== undefined) {
        hasFullMetadata = true;

        // Fill out video details with better information
        videoDetails.title = currentItem.title.runs.map(v => v.text).join(""); // Can contain featuring text which isn't in player response
        videoDetails.thumbnail = currentItem.thumbnail; // Can contain more thumbnails than player response

        for (let i = 0; i < currentItem.longBylineText.runs.length; i++) {
          const item = currentItem.longBylineText.runs[i];
          if (item.navigationEndpoint) {
            if (item.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType === "MUSIC_PAGE_TYPE_ALBUM") {
              album = {
                id: item.navigationEndpoint.browseEndpoint.browseId,
                text: item.text
              }
            }
          }
        }
      }

      let state = enixmStore.getState();
      const likeButtonData = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").querySelector("ytmusic-like-button-renderer").data;
      const defaultLikeStatus = likeButtonData?.likeStatus ?? "UNKNOWN";
      const storeLikeStatus = state.likeStatus.videos[videoDetails.videoId];
      
      const likeStatus = storeLikeStatus ? state.likeStatus.videos[videoDetails.videoId] : defaultLikeStatus;

      window.enixm.sendVideoData(videoDetails, playlistId, album, likeStatus, hasFullMetadata);
    }
  });
  enixmStore.subscribe(() => {
    sendStoreState();
  });
  window.addEventListener("yt-action", e => {
    if (e.detail.actionName === "yt-service-request") {
      if (e.detail.args[1].createPlaylistServiceEndpoint) {
        let title = e.detail.args[2].create_playlist_title;
        let returnValue = e.detail.returnValue;
        returnValue[0].ajaxPromise.then(response => {
          let id = response.data.playlistId;
          window.enixm.sendCreatePlaylistObservation({
            title,
            id
          });
        });
      }
    } else if (e.detail.actionName === "yt-handle-playlist-deletion-command") {
      let playlistId = e.detail.args[0].handlePlaylistDeletionCommand.playlistId;
      window.enixm.sendDeletePlaylistObservation(playlistId);
    }
  });
})
