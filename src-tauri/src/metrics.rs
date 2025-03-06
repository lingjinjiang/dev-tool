use reqwest::Client;
use serde_json::{error, Value};
use tauri::http::status;
const API_QUERY_RANGE: &str = "/api/v1/query_range";

#[tauri::command]
pub async fn prometheus_query_range(
    prom_url: &str,
    prom_ql: &str,
    start_time: u64,
    end_time: u64,
    step: Option<f64>,
) -> Result<Value, String> {
    let start_sec = (start_time / 1000).to_string();
    let end_sec = (end_time / 1000).to_string();
    let step_sec = step.map(|s| s.to_string());

    let url = format!("{}{}", prom_url, API_QUERY_RANGE);
    let mut query_params = vec![("query", prom_ql), ("start", &start_sec), ("end", &end_sec)];
    if let Some(s) = &step_sec {
        query_params.push(("step", s));
    }

    let client: Client = Client::new();
    match client.post(&url).query(&query_params).send().await {
        Ok(response) => {
            if !response.status().is_success() {
                let status = response.status();
                return Err(format!("HTTP error {}", status).into());
            }
            match response.json::<Value>().await {
                Ok(json_response) => Ok(json_response),
                Err(err) => Err(format!("invalid response: {}", err).into()),
            }
        }
        Err(err) => Err(format!("failed to send request: {}", err).into()),
    }
}
