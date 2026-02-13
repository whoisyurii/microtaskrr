use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{
    image::Image,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tauri_plugin_store::StoreExt;

#[cfg(target_os = "macos")]
fn hide_from_dock() {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSApplication, NSApplicationActivationPolicy};

    unsafe {
        let mtm = MainThreadMarker::new_unchecked();
        let app = NSApplication::sharedApplication(mtm);
        app.setActivationPolicy(NSApplicationActivationPolicy::Accessory);
    }
}

struct PreviousApp(Mutex<Option<String>>);
struct SleepUntil(Mutex<Option<Instant>>);

fn get_frontmost_bundle_id() -> Option<String> {
    let output = Command::new("osascript")
        .args([
            "-e",
            "tell application \"System Events\" to get bundle identifier of first application process whose frontmost is true",
        ])
        .output()
        .ok()?;
    let id = String::from_utf8(output.stdout).ok()?.trim().to_string();
    if id.is_empty() { None } else { Some(id) }
}

fn activate_bundle_id(bundle_id: &str) {
    let _ = Command::new("osascript")
        .args([
            "-e",
            &format!("tell application id \"{}\" to activate", bundle_id),
        ])
        .output();
}

fn is_sleeping(app: &tauri::AppHandle) -> bool {
    if let Some(state) = app.try_state::<SleepUntil>() {
        if let Some(until) = *state.0.lock().unwrap() {
            if Instant::now() < until {
                return true;
            }
        }
    }
    false
}

fn handle_cli_args(app: &tauri::AppHandle, args: &[String]) {
    if let Some(window) = app.get_webview_window("main") {
        for arg in args.iter() {
            match arg.as_str() {
                "show" => {
                    if is_sleeping(app) {
                        return;
                    }
                    // Save the currently focused app before stealing focus
                    if let Some(state) = app.try_state::<PreviousApp>() {
                        if let Some(bid) = get_frontmost_bundle_id() {
                            *state.0.lock().unwrap() = Some(bid);
                        }
                    }
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = app.emit("microtaskrr-show", ());
                }
                "hide" => {
                    let _ = app.emit("microtaskrr-hide", ());
                    let win = window.clone();
                    let handle = app.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        let _ = win.hide();
                        // Restore focus to previous app
                        if let Some(state) = handle.try_state::<PreviousApp>() {
                            if let Some(bid) = state.0.lock().unwrap().take() {
                                activate_bundle_id(&bid);
                            }
                        }
                    });
                }
                "notify" => {
                    let _ = app.emit("microtaskrr-done", ());
                }
                _ => {}
            }
        }
    }
}

#[tauri::command]
fn get_stats(app: tauri::AppHandle) -> Result<String, String> {
    let store = app
        .store("stats.json")
        .map_err(|e: tauri_plugin_store::Error| e.to_string())?;
    let stats: Option<serde_json::Value> = store.get("stats");
    match stats {
        Some(val) => Ok(val.to_string()),
        None => Ok("{}".to_string()),
    }
}

#[tauri::command]
fn save_stats(app: tauri::AppHandle, stats: String) -> Result<(), String> {
    let store = app
        .store("stats.json")
        .map_err(|e: tauri_plugin_store::Error| e.to_string())?;
    let parsed: serde_json::Value =
        serde_json::from_str(&stats).map_err(|e| e.to_string())?;
    store.set("stats", parsed);
    store.save().map_err(|e: tauri_plugin_store::Error| e.to_string())
}

#[tauri::command]
fn focus_previous_app(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    if let Some(state) = app.try_state::<PreviousApp>() {
        if let Some(bid) = state.0.lock().unwrap().take() {
            activate_bundle_id(&bid);
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_single_instance::init(|app, args, _cwd| {
                handle_cli_args(app, &args);
            }),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(PreviousApp(Mutex::new(None)))
        .manage(SleepUntil(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![get_stats, save_stats, focus_previous_app])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            hide_from_dock();

            let show_i =
                tauri::menu::MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide_i =
                tauri::menu::MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let wake_i =
                tauri::menu::MenuItem::with_id(app, "wake", "Wake up", true, None::<&str>)?;
            let quit_i =
                tauri::menu::MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let sleep_sub = tauri::menu::SubmenuBuilder::with_id(app, "sleep", "Sleep for...")
                .item(&tauri::menu::MenuItem::with_id(app, "sleep_30m", "30 minutes", true, None::<&str>)?)
                .item(&tauri::menu::MenuItem::with_id(app, "sleep_1h", "1 hour", true, None::<&str>)?)
                .item(&tauri::menu::MenuItem::with_id(app, "sleep_2h", "2 hours", true, None::<&str>)?)
                .item(&tauri::menu::MenuItem::with_id(app, "sleep_4h", "4 hours", true, None::<&str>)?)
                .item(&tauri::menu::MenuItem::with_id(app, "sleep_8h", "8 hours", true, None::<&str>)?)
                .build()?;

            let menu = tauri::menu::MenuBuilder::new(app)
                .item(&show_i)
                .item(&hide_i)
                .separator()
                .item(&sleep_sub)
                .item(&wake_i)
                .separator()
                .item(&quit_i)
                .build()?;

            let icon_bytes = include_bytes!("../../src/assets/icon.png");
            let icon = Image::from_bytes(icon_bytes)?;

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .on_menu_event(|app, event| {
                    let id = event.id.as_ref();
                    match id {
                        "show" => handle_cli_args(app, &["show".to_string()]),
                        "hide" => handle_cli_args(app, &["hide".to_string()]),
                        "wake" => {
                            if let Some(state) = app.try_state::<SleepUntil>() {
                                *state.0.lock().unwrap() = None;
                            }
                        }
                        "quit" => app.exit(0),
                        _ if id.starts_with("sleep_") => {
                            let mins: u64 = match id {
                                "sleep_30m" => 30,
                                "sleep_1h" => 60,
                                "sleep_2h" => 120,
                                "sleep_4h" => 240,
                                "sleep_8h" => 480,
                                _ => return,
                            };
                            if let Some(state) = app.try_state::<SleepUntil>() {
                                *state.0.lock().unwrap() =
                                    Some(Instant::now() + Duration::from_secs(mins * 60));
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            let args: Vec<String> = std::env::args().collect();
            if args.len() > 1 {
                handle_cli_args(app.handle(), &args[1..]);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
