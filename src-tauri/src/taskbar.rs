#[cfg(target_os = "windows")]
pub mod win {
    use log::info;
    use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
    use std::sync::OnceLock;
    use tauri::{AppHandle, Manager};
    use windows::core::w;
    use windows::Win32::Foundation::*;
    use windows::Win32::System::Com::*;
    use windows::Win32::UI::Shell::*;
    use windows::Win32::UI::WindowsAndMessaging::*;

    pub const THUMBBAR_BTN_PREV: u32 = 1001;
    pub const THUMBBAR_BTN_PLAY: u32 = 1002;
    pub const THUMBBAR_BTN_NEXT: u32 = 1003;
    const SUBCLASS_ID: usize = 4201;
    const WM_UPDATE_PLAY_STATE: u32 = WM_USER + 101;

    const PLAY_PNG: &[u8] = include_bytes!("../../assets/controls/play-button.png");
    const PAUSE_PNG: &[u8] = include_bytes!("../../assets/controls/pause-button.png");
    const NEXT_PNG: &[u8] = include_bytes!("../../assets/controls/play-next-button.png");
    const PREV_PNG: &[u8] = include_bytes!("../../assets/controls/play-previous-button.png");

    static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
    static TASKBAR_BUTTON_CREATED_MSG: AtomicU32 = AtomicU32::new(0);
    static CURRENT_PLAYING: AtomicBool = AtomicBool::new(false);
    static BUTTONS_ADDED: AtomicBool = AtomicBool::new(false);

    pub fn is_current_playing() -> bool {
        CURRENT_PLAYING.load(Ordering::SeqCst)
    }

    pub struct TaskbarController {
        hwnd: HWND,
        taskbar: Option<ITaskbarList3>,
        icon_play: HICON,
        icon_pause: HICON,
        icon_next: HICON,
        icon_prev: HICON,
    }

    unsafe impl Send for TaskbarController {}
    unsafe impl Sync for TaskbarController {}

    impl TaskbarController {
        pub fn new(hwnd_raw: *mut std::ffi::c_void, app_handle: AppHandle) -> Self {
            let hwnd = HWND(hwnd_raw);
            let _ = APP_HANDLE.set(app_handle);

            unsafe {
                let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

                let taskbar: Option<ITaskbarList3> =
                    CoCreateInstance(&TaskbarList, None, CLSCTX_INPROC_SERVER).ok();

                if let Some(ref tb) = taskbar {
                    let _ = tb.HrInit();
                }

                // Register TaskbarButtonCreated window message
                let msg_id = RegisterWindowMessageW(w!("TaskbarButtonCreated"));
                if msg_id != 0 {
                    TASKBAR_BUTTON_CREATED_MSG.store(msg_id, Ordering::SeqCst);
                }

                // Create custom icons from embedded control PNGs
                let icon_play = CreateIconFromResourceEx(
                    PLAY_PNG,
                    true,
                    0x00030000,
                    24,
                    24,
                    LR_DEFAULTCOLOR,
                )
                .unwrap_or_default();

                let icon_pause = CreateIconFromResourceEx(
                    PAUSE_PNG,
                    true,
                    0x00030000,
                    24,
                    24,
                    LR_DEFAULTCOLOR,
                )
                .unwrap_or_default();

                let icon_next = CreateIconFromResourceEx(
                    NEXT_PNG,
                    true,
                    0x00030000,
                    24,
                    24,
                    LR_DEFAULTCOLOR,
                )
                .unwrap_or_default();

                let icon_prev = CreateIconFromResourceEx(
                    PREV_PNG,
                    true,
                    0x00030000,
                    24,
                    24,
                    LR_DEFAULTCOLOR,
                )
                .unwrap_or_default();

                // Subclass window to handle WM_COMMAND (button clicks) and TaskbarButtonCreated (window unhide)
                let _ = SetWindowSubclass(hwnd, Some(taskbar_subclass_proc), SUBCLASS_ID, 0);

                Self {
                    hwnd,
                    taskbar,
                    icon_play,
                    icon_pause,
                    icon_next,
                    icon_prev,
                }
            }
        }

        pub fn ensure_buttons(&self, is_playing: bool) {
            CURRENT_PLAYING.store(is_playing, Ordering::SeqCst);

            unsafe {
                if let Some(ref tb) = self.taskbar {
                    let play_icon = if is_playing {
                        self.icon_pause
                    } else {
                        self.icon_play
                    };
                    let play_tip = if is_playing {
                        "Duraklat"
                    } else {
                        "Oynat"
                    };

                    let buttons = [
                        THUMBBUTTON {
                            dwMask: THB_FLAGS | THB_TOOLTIP | THB_ICON,
                            iId: THUMBBAR_BTN_PREV,
                            iBitmap: 0,
                            hIcon: self.icon_prev,
                            szTip: encode_utf16_buf("Önceki Şarkı"),
                            dwFlags: THBF_ENABLED,
                        },
                        THUMBBUTTON {
                            dwMask: THB_FLAGS | THB_TOOLTIP | THB_ICON,
                            iId: THUMBBAR_BTN_PLAY,
                            iBitmap: 0,
                            hIcon: play_icon,
                            szTip: encode_utf16_buf(play_tip),
                            dwFlags: THBF_ENABLED,
                        },
                        THUMBBUTTON {
                            dwMask: THB_FLAGS | THB_TOOLTIP | THB_ICON,
                            iId: THUMBBAR_BTN_NEXT,
                            iBitmap: 0,
                            hIcon: self.icon_next,
                            szTip: encode_utf16_buf("Sonraki Şarkı"),
                            dwFlags: THBF_ENABLED,
                        },
                    ];

                    if !BUTTONS_ADDED.load(Ordering::SeqCst) {
                        let add_res = tb.ThumbBarAddButtons(self.hwnd, &buttons);
                        info!("Taskbar ThumbBarAddButtons: {:?}, is_playing={}", add_res, is_playing);
                        if add_res.is_ok() {
                            BUTTONS_ADDED.store(true, Ordering::SeqCst);
                        }
                    } else {
                        let update_res = tb.ThumbBarUpdateButtons(self.hwnd, &buttons);
                        info!("Taskbar ThumbBarUpdateButtons: {:?}, is_playing={}", update_res, is_playing);
                        // If update fails because buttons were not yet registered, allow fallback to AddButtons
                        if update_res.is_err() {
                            BUTTONS_ADDED.store(false, Ordering::SeqCst);
                        }
                    }
                }
            }
        }

        pub fn init_buttons(&self) {
            let is_playing = CURRENT_PLAYING.load(Ordering::SeqCst);
            self.ensure_buttons(is_playing);
        }

        pub fn do_update_play_button(&self, is_playing: bool) {
            self.ensure_buttons(is_playing);
        }

        pub fn update_play_state(&self, is_playing: bool) {
            CURRENT_PLAYING.store(is_playing, Ordering::SeqCst);
            unsafe {
                let _ = PostMessageW(
                    Some(self.hwnd),
                    WM_UPDATE_PLAY_STATE,
                    WPARAM(if is_playing { 1 } else { 0 }),
                    LPARAM(0),
                );
            }
        }
    }

    pub fn restore_taskbar_buttons(app: &AppHandle) {
        BUTTONS_ADDED.store(false, Ordering::SeqCst);
        if let Some(tb_state) = app.try_state::<std::sync::Arc<std::sync::Mutex<Option<TaskbarController>>>>() {
            if let Ok(lock) = tb_state.lock() {
                if let Some(ref tb) = *lock {
                    tb.init_buttons();
                }
            }
        }
    }

    unsafe extern "system" fn taskbar_subclass_proc(
        hwnd: HWND,
        msg: u32,
        wparam: WPARAM,
        lparam: LPARAM,
        _uid_subclass: usize,
        _ref_data: usize,
    ) -> LRESULT {
        // 1. Taskbar button recreated (e.g. unhidden from tray or explorer restarted)
        let taskbar_created = TASKBAR_BUTTON_CREATED_MSG.load(Ordering::SeqCst);
        if taskbar_created != 0 && msg == taskbar_created {
            info!("Received TaskbarButtonCreated window message! Restoring thumbnail buttons...");
            BUTTONS_ADDED.store(false, Ordering::SeqCst);
            if let Some(app) = APP_HANDLE.get() {
                if let Some(tb_state) = app.try_state::<std::sync::Arc<std::sync::Mutex<Option<TaskbarController>>>>() {
                    if let Ok(lock) = tb_state.lock() {
                        if let Some(ref tb) = *lock {
                            let is_playing = CURRENT_PLAYING.load(Ordering::SeqCst);
                            tb.ensure_buttons(is_playing);
                        }
                    }
                }
            }
            return LRESULT(0);
        }

        // 2. Play state updated from player bridge (dispatched to UI thread for COM STA safety)
        if msg == WM_UPDATE_PLAY_STATE {
            let is_playing = wparam.0 != 0;
            if let Some(app) = APP_HANDLE.get() {
                if let Some(tb_state) = app.try_state::<std::sync::Arc<std::sync::Mutex<Option<TaskbarController>>>>() {
                    if let Ok(lock) = tb_state.lock() {
                        if let Some(ref tb) = *lock {
                            tb.do_update_play_button(is_playing);
                        }
                    }
                }
            }
            return LRESULT(0);
        }

        // 3. Handle Thumbnail Toolbar button clicks (WM_COMMAND with THBN_CLICKED = 0x1800)
        if msg == WM_COMMAND {
            let notify_code = (wparam.0 >> 16) as u16;
            let button_id = (wparam.0 & 0xffff) as u32;

            if notify_code == 0x1800 {
                info!("Thumbnail toolbar button clicked: ID {}", button_id);
                if let Some(app) = APP_HANDLE.get() {
                    if let Some(win) = app.get_webview_window("main") {
                        match button_id {
                            THUMBBAR_BTN_PREV => {
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.previous()");
                            }
                            THUMBBAR_BTN_PLAY => {
                                let next_playing = !CURRENT_PLAYING.load(Ordering::SeqCst);
                                CURRENT_PLAYING.store(next_playing, Ordering::SeqCst);
                                if let Some(app) = APP_HANDLE.get() {
                                    if let Some(tb_state) = app.try_state::<std::sync::Arc<std::sync::Mutex<Option<TaskbarController>>>>() {
                                        if let Ok(lock) = tb_state.lock() {
                                            if let Some(ref tb) = *lock {
                                                tb.ensure_buttons(next_playing);
                                            }
                                        }
                                    }
                                }
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.togglePlay()");
                            }
                            THUMBBAR_BTN_NEXT => {
                                let _ = win.eval("window.enixPlayer && window.enixPlayer.next()");
                            }
                            _ => {}
                        }
                    }
                }
                return LRESULT(0);
            }
        }

        unsafe { DefSubclassProc(hwnd, msg, wparam, lparam) }
    }

    fn encode_utf16_buf(s: &str) -> [u16; 260] {
        let mut buf = [0u16; 260];
        for (i, c) in s.encode_utf16().take(259).enumerate() {
            buf[i] = c;
        }
        buf
    }
}
