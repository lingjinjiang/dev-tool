#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use grok::Grok;
use std::collections::HashMap;

mod lance;
mod metrics;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            extract_fields,
            validate_grok,
            default_patterns,
            metrics::prometheus_query_range,
            lance::list_lance_tables,
            lance::get_table_info,
            lance::get_table_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn extract_fields(expr: &str, text: &str) -> Result<HashMap<String, String>, String> {
    match complie_grok_expor(expr) {
        Ok(pattern) => match pattern.match_against(text) {
            Some(named_fields) => {
                let mut result: HashMap<String, String> = HashMap::new();
                for field in named_fields.iter() {
                    result.insert(String::from(field.0), String::from(field.1));
                }
                Ok(result)
            }
            None => Err(String::from(
                "input text did not match given grok expression",
            )),
        },
        Err(err) => Err(String::from(format!("invalid grok: {}", err))),
    }
}

fn complie_grok_expor(expr: &str) -> Result<grok::Pattern, grok::Error> {
    let mut grok = Grok::default();
    grok.compile(expr, true)
}

#[tauri::command]
fn validate_grok(expr: &str) -> Result<Vec<String>, String> {
    match complie_grok_expor(expr) {
        Ok(pattern) => {
            let mut result: Vec<String> = vec![];
            for p in pattern.capture_names() {
                result.push(String::from(p))
            }
            if result.len() == 0 {
                Err(String::from(format!("no named field")))
            } else {
                Ok(result)
            }
        }
        Err(err) => Err(String::from(format!("invalid grok expression: {}", err))),
    }
}

#[tauri::command]
fn default_patterns() -> HashMap<String, String> {
    let patterns = grok::patterns();
    let mut result: HashMap<String, String> = HashMap::new();
    for p in patterns.iter() {
        result.insert(String::from(p.0), String::from(p.1));
    }
    result
}
