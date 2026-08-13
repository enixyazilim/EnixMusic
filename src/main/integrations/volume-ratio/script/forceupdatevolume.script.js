(function() {
  let volume = document.querySelector("ytmusic-player-bar").playerApi.getVolume();
  document.querySelector("ytmusic-player-bar").playerApi.setVolume(volume);
  window.__ENIXM_HOOK__.enixmStore.dispatch({ type: 'SET_VOLUME', payload: volume });
})
