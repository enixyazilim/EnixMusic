import { tr } from "./tr";

export const en: typeof tr = {
  tabs: {
    general: "General",
    appearance: "Appearance",
    playback: "Playback",
    integrations: "Integrations",
    shortcuts: "Shortcuts",
    about: "About"
  },
  restart: {
    bannerMessage: "Restart application to apply changes",
    button: "Restart",
    restartForUpdate: "Restart to Update"
  },
  general: {
    language: "Application Language",
    languageDesc: "Sets the display language used across the application interface",
    hideToTrayOnClose: "Minimize to tray on close",
    hideToTrayOnCloseDesc: "Minimizes the application to the system tray instead of exiting when closing the window",
    showNotificationOnSongChange: "Show notification on track change",
    showNotificationOnSongChangeDesc: "Displays a desktop notification with track title and artwork when a new song starts playing",
    startOnBoot: "Start application on system boot",
    startOnBootDesc: "Automatically launches Enix Music in the background when your computer starts",
    adblockerEnabled: "Ad Blocker (Adblocker)",
    adblockerEnabledDesc: "Automatically blocks audio and visual advertisements on YouTube Music",
    disableHardwareAcceleration: "Disable hardware acceleration",
    disableHardwareAccelerationDesc: "Renders graphics using the CPU instead of the GPU. Resolves freeze and black screen issues on older systems"
  },
  appearance: {
    alwaysShowVolumeSlider: "Always show volume slider",
    alwaysShowVolumeSliderDesc: "Keeps the bottom-right volume control bar permanently visible without hovering",
    customCSSEnabled: "Use custom CSS",
    customCSSEnabledDesc: "Allows personalizing the application interface using a custom .css stylesheet",
    customCSSPath: "Custom CSS file path",
    customCSSPathDesc: "Select the .css theme file from your computer to be injected into the player",
    zoom: "Zoom Level",
    zoomDesc: "Determines the interface scale and text zoom percentage",
    trayIconStyle: "Tray icon style",
    trayIconStyleDesc: "Selects the color theme for the Enix Music icon in the system tray",
    trayStyles: {
      auto: "Auto",
      white: "White",
      black: "Black"
    }
  },
  playback: {
    continueWhereYouLeftOff: "Continue where you left off",
    continueWhereYouLeftOffDesc: "Automatically restores the last played song and playback position when the app reopens",
    continueWhereYouLeftOffPaused: "Start paused on launch",
    continueWhereYouLeftOffPausedDesc: "Restores the last played track in a paused state instead of playing automatically on launch",
    progressInTaskbar: "Show playback progress in taskbar",
    progressInTaskbarDesc: "Displays a real-time track progress bar behind the Windows taskbar icon",
    enableSpeakerFill: "Multi-channel Audio (5.1 / 7.1 Speaker Fill)",
    enableSpeakerFillDesc: "Expands stereo music across all surround speakers in 5.1 or 7.1 speaker setups",
    ratioVolume: "Precision Decibel Volume Control (Logarithmic)",
    ratioVolumeDesc: "Adjusts volume scaling proportionally according to human hearing perception (Decibel scale)",
    autoConfirmKeepPlaying: "Auto-confirm 'Still Watching / Keep Playing'",
    autoConfirmKeepPlayingDesc: "Automatically bypasses YouTube's inactivity confirmation prompt and prevents playback from stopping"
  },
  integrations: {
    companionServer: "Companion Server (Mobile Remote Control)",
    companionServerDesc: "Starts a local network server allowing you to control playback remotely from mobile devices (phone/tablet)",
    safeStorageDisabledMessage: "This integration cannot be enabled because safeStorage is unavailable",
    corsWildcard: "Allow browser cross-origin communication",
    corsWildcardDesc: "This setting may be hazardous as it allows any visited website to communicate with your local companion server",
    authWindow: "Enable companion authorization window",
    authWindowDesc: "Automatically disables after the first successful pairing or after 5 minutes",
    authorizedCompanions: "Authorized Devices",
    authorizedCompanionsDesc: "List of companion devices currently granted access to the local server",
    tableHeaderName: "Name",
    tableHeaderVersion: "Version",
    noAuthorizedCompanions: "No authorized devices",
    discordPresence: "Discord Rich Presence",
    discordPresenceDesc: "Displays the active song title, artist name, and album artwork on your Discord profile",
    discordFailure: "Discord is not running or unreachable",
    reconnect: "Reconnect"
  },
  shortcuts: {
    registerErrorTitle: "Failed to register shortcut. Another application might be using it.",
    playPause: "Play / Pause",
    next: "Next Track",
    previous: "Previous Track",
    thumbsUp: "Like (Thumbs Up)",
    thumbsDown: "Dislike (Thumbs Down)",
    volumeUp: "Volume Up",
    volumeDown: "Volume Down"
  },
  about: {
    developedBy: "Developed by Enix Yazılım",
    checkForUpdates: "Check for Updates",
    checkingForUpdates: "Checking for updates...",
    downloadingUpdate: "Downloading update...",
    noUpdateFound: "No updates found",
    autoUpdatesDisabled: "Automatic updates are disabled in this build"
  },
  tray: {
    showHide: "Show / Hide Window",
    playPause: "Play / Pause",
    previous: "Previous",
    next: "Next",
    settings: "Settings",
    quit: "Quit"
  },
  authWindow: {
    title: "Device Authorization Request",
    subtitle: "{appName} wants to control Enix Music",
    codeConfirm: "Please ensure the code below matches the code displayed on {appName}",
    deny: "Deny",
    allow: "Allow"
  },
  loading: {
    checkingForUpdates: "Checking for updates...",
    downloadingUpdate: "Downloading update...",
    starting: "Starting...",
    loadingApp: "Loading Enix Music...",
    loaded: "Enix Music Loaded",
    loadFailed: "Failed to load Enix Music",
    started: "Started",
    timeout: "Enix Music is taking longer than usual to load..."
  }
};
