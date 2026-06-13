use serde_json::Value;
use tauri::State;

use crate::ClientState;

const API_QUERY_RANGE: &str = "/api/v1/query_range";

#[tauri::command]
pub async fn prometheus_query_range(
    prom_url: &str,
    prom_ql: &str,
    start_time: u64,
    end_time: u64,
    step: Option<u64>,
    state: State<'_, ClientState>,
) -> Result<Value, String> {
    let start_sec = (start_time / 1000).to_string();
    let end_sec = (end_time / 1000).to_string();
    let step_str = step.map(|s| format!("{}s", s));

    let url = format!("{}{}", prom_url, API_QUERY_RANGE);
    let mut query_params = vec![
        ("query", prom_ql),
        ("start", start_sec.as_str()),
        ("end", end_sec.as_str()),
    ];
    if let Some(ref s) = step_str {
        query_params.push(("step", s.as_str()));
    }

    let response = state
        .client
        .post(&url)
        .query(&query_params)
        .send()
        .await
        .map_err(|e| format!("failed to send request: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error {}", response.status()));
    }

    response
        .json::<Value>()
        .await
        .map_err(|e| format!("invalid response: {}", e))
}
