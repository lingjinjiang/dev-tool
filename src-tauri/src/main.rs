#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use grok::Grok;
use std::collections::HashMap;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![extract_fields])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn extract_fields(expr: &str, text: &str) -> Result<HashMap<String, String>, String> {
    let mut grok = Grok::default();
    match grok.compile(expr, true) {
        Ok(pattern) => match pattern.match_against(text) {
            Some(named_fields) => {
                let mut result: HashMap<String, String> = HashMap::new();
                for field in named_fields.iter() {
                    result.insert(String::from(field.0), String::from(field.1));
                }
                println!("{:?}", result);
                Ok(result)
            }
            None => Err(String::from(
                "input text did not match given grok expression",
            )),
        },
        Err(err) => Err(String::from(format!("invalid grok: {}", err))),
    }
}
