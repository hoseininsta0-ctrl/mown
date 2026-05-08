use std::process::{Command, Stdio};
use tokio::time::{sleep, Duration};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      if !cfg!(debug_assertions) {
        tauri::async_runtime::block_on(async {
          let resources_path = app
            .path()
            .resource_dir()
            .expect("failed to get resource dir")
            .join("app");

          let server_script = resources_path.join("server.js");

          Command::new("node")
            .arg(server_script)
            .env("PORT", "39871")
            .env("HOSTNAME", "127.0.0.1")
            .env("NODE_ENV", "production")
            .current_dir(resources_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("failed to start Next.js server");

          sleep(Duration::from_secs(2)).await;
        });
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
