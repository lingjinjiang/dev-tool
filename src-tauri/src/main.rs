#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use grok::Grok;
use reqwest::Client;
use std::collections::HashMap;
use std::time::Duration;

mod lance;
mod metrics;

pub struct ClientState {
    client: Client,
}

impl ClientState {
    fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("failed to build HTTP client");
        Self { client }
    }
}

fn main() {
    tauri::Builder::default()
        .manage(ClientState::new())
        .invoke_handler(tauri::generate_handler![
            extract_fields,
            validate_grok,
            default_patterns,
            metrics::prometheus_query_range,
            lance::list_lance_tables,
            lance::get_table_info,
            lance::get_table_data,
            lance::execute_lance_sql
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn extract_fields(expr: &str, text: &str) -> Result<HashMap<String, String>, String> {
    let pattern = compile_grok_expr(expr).map_err(|e| format!("invalid grok: {}", e))?;
    let named_fields = pattern
        .match_against(text)
        .ok_or("input text did not match given grok expression")?;

    let mut result = HashMap::new();
    for (name, value) in named_fields.iter() {
        result.insert(name.to_string(), value.to_string());
    }
    Ok(result)
}

fn compile_grok_expr(expr: &str) -> Result<grok::Pattern, grok::Error> {
    let mut grok = Grok::default();
    grok.compile(expr, true)
}

#[tauri::command]
fn validate_grok(expr: &str) -> Result<Vec<String>, String> {
    let pattern = compile_grok_expr(expr).map_err(|e| format!("invalid grok expression: {}", e))?;
    let names: Vec<String> = pattern
        .capture_names()
        .map(|name| name.to_string())
        .collect();

    if names.is_empty() {
        Err("no named field".to_string())
    } else {
        Ok(names)
    }
}

#[tauri::command]
fn default_patterns() -> HashMap<String, String> {
    grok::patterns()
        .iter()
        .map(|(name, pattern)| (name.to_string(), pattern.to_string()))
        .collect()
}
