/* eslint-disable @typescript-eslint/no-unused-expressions */
(function () {
  try {
    function isExperimentEnabled(experimentFlag) {
      try {
        const flag = window.ytcfg?.data_?.EXPERIMENT_FLAGS?.[experimentFlag];
        if (flag && typeof flag === "string") return flag === "false" ? false : true;
        return !!flag;
      } catch (e) {
        return false;
      }
    }

    const enixmStore = window.__ENIXM_HOOK__?.enixmStore;
    let enixmControlButtons = {};
    let currentVideoId = "";
    let libraryFeedbackDefaultToken = "";
    let libraryFeedbackToggledToken = "";
    let sleepTimerTimeout = null;

    let libraryButton = document.createElement("yt-button-shape");
    libraryButton.classList.add("enixm-player-bar-control", "library-button");
    let libraryButtonData = {
      focused: false,
      iconPosition: "icon-only",
      onTap: function () {
        try {
          var closePopupEvent = {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
              actionName: "yt-close-popups-action",
              args: [["ytmusic-menu-popup-renderer"]],
              optionalAction: false,
              returnValue: []
            }
          };
          var feedbackEvent = {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
              actionName: "yt-service-request",
              args: [
                this,
                {
                  feedbackEndpoint: {
                    feedbackToken: libraryButtonData.toggled ? libraryFeedbackToggledToken : libraryFeedbackDefaultToken
                  }
                }
              ],
              optionalAction: false,
              returnValue: []
            }
          };
          this.dispatchEvent(new CustomEvent("yt-action", closePopupEvent));
          this.dispatchEvent(new CustomEvent("yt-action", feedbackEvent));
          window.__ENIXM_HOOK__?.enixmStore?.dispatch({
            type: "SET_FEEDBACK_TOGGLE_STATE",
            payload: { defaultEndpointFeedbackToken: libraryFeedbackDefaultToken, isToggled: !libraryButtonData.toggled }
          });
        } catch (err) {
          console.warn("[ENIXM] libraryButton onTap hatasi:", err);
        }
      }.bind(libraryButton),
      style: "mono",
      toggled: false,
      toggleable: true,
      type: "text"
    };
    libraryButton.rawProps = {
      iconName: "yt-sys-icons:library_add",
      data: libraryButtonData
    };

    let playlistButton = document.createElement("yt-button-shape");
    playlistButton.classList.add("enixm-player-bar-control", "playlist-button");
    let playlistButtonData = {
      focused: false,
      iconPosition: "icon-only",
      onTap: function () {
        try {
          var closePopupEvent = {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
              actionName: "yt-close-popups-action",
              args: [["ytmusic-menu-popup-renderer"]],
              optionalAction: false,
              returnValue: []
            }
          };
          var returnValue = [];
          var serviceRequestEvent = {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
              actionName: "yt-service-request",
              args: [
                this,
                {
                  addToPlaylistEndpoint: {
                    videoId: currentVideoId
                  }
                }
              ],
              optionalAction: false,
              returnValue
            }
          };
          this.dispatchEvent(new CustomEvent("yt-action", closePopupEvent));
          this.dispatchEvent(new CustomEvent("yt-action", serviceRequestEvent));
          if (returnValue?.[0]?.ajaxPromise) {
            returnValue[0].ajaxPromise.then(
              response => {
                var addToPlaylistEvent = {
                  bubbles: true,
                  cancelable: false,
                  composed: true,
                  detail: {
                    actionName: "yt-open-popup-action",
                    args: [
                      {
                        openPopupAction: {
                          popup: {
                            addToPlaylistRenderer: response?.data?.contents?.[0]?.addToPlaylistRenderer
                          },
                          popupType: "DIALOG"
                        }
                      },
                      this
                    ],
                    optionalAction: false,
                    returnValue: []
                  }
                };
                this.dispatchEvent(new CustomEvent("yt-action", addToPlaylistEvent));
                this.dispatchEvent(new CustomEvent("yt-action", closePopupEvent));
              },
              () => {},
              this
            );
          }
        } catch (err) {
          console.warn("[ENIXM] playlistButton onTap hatasi:", err);
        }
      }.bind(playlistButton),
      style: "mono",
      toggled: false,
      type: "text"
    };
    playlistButton.rawProps = {
      iconName: "yt-sys-icons:playlist_add",
      data: playlistButtonData
    };

    let controlsInjected = false;
    let sleepTimerInjected = false;

    function tryInjectButtons() {
      try {
        const playerBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
        if (!playerBar) return false;

        // 1. Library ve Playlist butonları
        if (!controlsInjected) {
          const likeButton = playerBar.querySelector("ytmusic-like-button-renderer");
          if (likeButton && likeButton.parentNode) {
            likeButton.insertAdjacentElement("afterend", libraryButton);
            libraryButton.insertAdjacentElement("afterend", playlistButton);
            controlsInjected = true;
          }
        }

        // 2. Sleep timer butonu
        if (!sleepTimerInjected) {
          const rightControls = playerBar.querySelector(".right-controls-buttons");
          if (rightControls) {
            const shuffleBtn = rightControls.querySelector(".shuffle");
            let sleepTimerButton = document.createElement("yt-icon-button");

            let sleepTimerIcon = document.createElement("yt-icon");
            if (typeof sleepTimerIcon.set === "function") {
              sleepTimerIcon.set("icon", "TIMER");
            }
            sleepTimerButton.appendChild(sleepTimerIcon);

            sleepTimerButton.setAttribute("title", "Sleep timer off");
            sleepTimerButton.classList.add("ytmusic-player-bar", "enixm-player-bar-control", "sleep-timer-button");
            sleepTimerButton.onclick = () => {
              try {
                sleepTimerButton.dispatchEvent(
                  new CustomEvent("yt-action", {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                      actionName: "yt-open-popup-action",
                      args: [
                        {
                          openPopupAction: {
                            popup: {
                              menuPopupRenderer: {
                                accessibilityData: { label: "Action menu" },
                                items: [
                                  { menuServiceItemRenderer: { icon: { iconType: "CLOCK" }, serviceEndpoint: { enixmSleepTimerServiceEndpoint: { time: 5 } }, text: { runs: [{ text: "5 minutes" }] } } },
                                  { menuServiceItemRenderer: { icon: { iconType: "CLOCK" }, serviceEndpoint: { enixmSleepTimerServiceEndpoint: { time: 10 } }, text: { runs: [{ text: "10 minutes" }] } } },
                                  { menuServiceItemRenderer: { icon: { iconType: "CLOCK" }, serviceEndpoint: { enixmSleepTimerServiceEndpoint: { time: 15 } }, text: { runs: [{ text: "15 minutes" }] } } },
                                  { menuServiceItemRenderer: { icon: { iconType: "CLOCK" }, serviceEndpoint: { enixmSleepTimerServiceEndpoint: { time: 30 } }, text: { runs: [{ text: "30 minutes" }] } } },
                                  { menuServiceItemRenderer: { icon: { iconType: "CLOCK" }, serviceEndpoint: { enixmSleepTimerServiceEndpoint: { time: 45 } }, text: { runs: [{ text: "45 minutes" }] } } },
                                  { menuServiceItemRenderer: { icon: { iconType: "CLOCK" }, serviceEndpoint: { enixmSleepTimerServiceEndpoint: { time: 60 } }, text: { runs: [{ text: "1 hour" }] } } },
                                  sleepTimerTimeout !== null ? { menuServiceItemRenderer: { icon: { iconType: "DELETE" }, serviceEndpoint: { enixmSleepTimerServiceEndpoint: { time: 0 } }, text: { runs: [{ text: "Clear sleep timer" }] } } } : {}
                                ]
                              }
                            },
                            popupType: "DROPDOWN"
                          }
                        },
                        sleepTimerButton
                      ],
                      optionalAction: false,
                      returnValue: []
                    }
                  })
                );
              } catch (e) {}
            };

            if (shuffleBtn && shuffleBtn.parentNode) {
              shuffleBtn.insertAdjacentElement("afterend", sleepTimerButton);
              sleepTimerInjected = true;
            } else {
              rightControls.insertAdjacentElement("afterbegin", sleepTimerButton);
              sleepTimerInjected = true;
            }

            setupSleepTimerActionHandler(sleepTimerButton);
          }
        }

        // 3. PlayerApi video change listener
        if (playerBar.playerApi && typeof playerBar.playerApi.addEventListener === "function") {
          try {
            playerBar.playerApi.addEventListener("onVideoDataChange", event => {
              if (event?.playertype === 1 && (event?.type === "dataloaded" || event?.type === "dataupdated")) {
                currentVideoId = playerBar.playerApi?.getPlayerResponse?.()?.videoDetails?.videoId || "";
              }
            });
          } catch (e) {}
        }

        return controlsInjected && sleepTimerInjected;
      } catch (err) {
        console.warn("[ENIXM] tryInjectButtons hatasi:", err);
        return false;
      }
    }

    function setupSleepTimerActionHandler(sleepTimerButton) {
      const humanizeTime = time => {
        if (time === 1) return `${time} minute`;
        if (time > 1 && time < 60) return `${time} minutes`;
        if (time >= 60 && time < 120) return `${time / 60} hour`;
        if (time >= 120) return `${time / 60} hours`;
        return `${time} min`;
      };

      window.addEventListener("yt-action", e => {
        try {
          if (e?.detail?.actionName === "yt-service-request" && e.detail.args?.[1]?.enixmSleepTimerServiceEndpoint) {
            const timerEndpoint = e.detail.args[1].enixmSleepTimerServiceEndpoint;
            if (sleepTimerTimeout !== null) {
              clearTimeout(sleepTimerTimeout);
              sleepTimerTimeout = null;
              if (sleepTimerButton.classList.contains("active")) {
                sleepTimerButton.classList.remove("active");
                sleepTimerButton.setAttribute("title", "Sleep timer off");
              }
            }

            if (timerEndpoint.time > 0) {
              if (!sleepTimerButton.classList.contains("active")) {
                sleepTimerButton.classList.add("active");
                sleepTimerButton.setAttribute("title", `Sleep timer ${humanizeTime(timerEndpoint.time)}`);
              }

              document.body.dispatchEvent(
                new CustomEvent("yt-action", {
                  bubbles: true,
                  cancelable: false,
                  composed: true,
                  detail: {
                    actionName: "yt-open-popup-action",
                    args: [
                      {
                        openPopupAction: {
                          popup: {
                            notificationActionRenderer: {
                              responseText: { runs: [{ text: `Sleep timer set to ${humanizeTime(timerEndpoint.time)}` }] }
                            }
                          },
                          popupType: "TOAST",
                          uniqueId: crypto.randomUUID()
                        }
                      },
                      document.querySelector("ytmusic-app")
                    ],
                    optionalAction: false,
                    returnValue: []
                  }
                })
              );

              sleepTimerTimeout = setTimeout(
                () => {
                  sleepTimerTimeout = null;
                  sleepTimerButton.classList.remove("active");
                  sleepTimerButton.setAttribute("title", "Sleep timer off");

                  const pBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
                  if (pBar && (pBar.playing || !pBar.playerApi?.isPaused?.())) {
                    pBar.playerApi?.pauseVideo?.();
                  }
                },
                timerEndpoint.time * 1000 * 60
              );
            }
          }
        } catch (err) {
          console.warn("[ENIXM] SleepTimer action handler hatasi:", err);
        }
      });
    }

    // İlk deneme ve gerekirse retry
    if (!tryInjectButtons()) {
      let attempts = 0;
      const btnInterval = setInterval(() => {
        attempts++;
        if (tryInjectButtons() || attempts > 40) {
          clearInterval(btnInterval);
        }
      }, 500);
    }

    // Feedback tokens
    try {
      let defaultTokens = window.ytcfg?.data_?.FEEDBACK_TOKENS;
      if (defaultTokens) {
        libraryFeedbackDefaultToken = defaultTokens.add_to_library || "";
        libraryFeedbackToggledToken = defaultTokens.remove_from_library || "";
      }
    } catch (e) {}

    // Store listener
    if (enixmStore?.subscribe) {
      enixmStore.subscribe(() => {
        try {
          let state = enixmStore.getState() || {};
          const playerBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
          if (!playerBar || typeof playerBar.getMenuRenderer !== "function") return;

          const currentMenu = playerBar.getMenuRenderer();
          if (currentMenu && Array.isArray(currentMenu.items)) {
            if (playlistButton.classList.contains("hidden")) {
              playlistButton.classList.remove("hidden");
            }

            let foundLibraryButton = false;
            for (let i = 0; i < currentMenu.items.length; i++) {
              const item = currentMenu.items[i];
              const menuRenderer = item?.toggleMenuServiceItemRenderer;
              if (menuRenderer) {
                const iconType = menuRenderer.defaultIcon?.iconType;
                if (iconType === "BOOKMARK_BORDER" || iconType === "BOOKMARK") {
                  foundLibraryButton = true;
                  libraryFeedbackDefaultToken = menuRenderer.defaultServiceEndpoint?.feedbackEndpoint?.feedbackToken || libraryFeedbackDefaultToken;
                  libraryFeedbackToggledToken = menuRenderer.toggledServiceEndpoint?.feedbackEndpoint?.feedbackToken || libraryFeedbackToggledToken;

                  const toggleState = state?.toggleStates?.feedbackToggleStates?.[libraryFeedbackDefaultToken];
                  if (toggleState !== undefined && toggleState !== null) {
                    libraryButtonData.toggled = toggleState;
                    if (libraryButton.setters?.data) libraryButton.setters.data(libraryButtonData);
                  }

                  if (iconType === "BOOKMARK_BORDER") {
                    if (libraryButton.setters?.iconName) {
                      libraryButton.setters.iconName(libraryButtonData.toggled ? "yt-sys-icons:library_saved" : "yt-sys-icons:library_add");
                    }
                  } else if (iconType === "BOOKMARK") {
                    if (libraryButton.setters?.iconName) {
                      libraryButton.setters.iconName(libraryButtonData.toggled ? "yt-sys-icons:library_add" : "yt-sys-icons:library_saved");
                    }
                  }
                  break;
                }
              }
            }

            if (!foundLibraryButton) {
              if (!libraryButton.classList.contains("hidden")) libraryButton.classList.add("hidden");
            } else {
              if (libraryButton.classList.contains("hidden")) libraryButton.classList.remove("hidden");
            }
          }
        } catch (err) {
          console.warn("[ENIXM] enixmStore subscribe update hatasi:", err);
        }
      });
    }

    enixmControlButtons.libraryButton = libraryButton;
  } catch (outerErr) {
    console.warn("[ENIXM] playerbarcontrols genel hata:", outerErr);
  }
})();
