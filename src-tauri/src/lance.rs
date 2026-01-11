use futures_util::stream::TryStreamExt;
use lance::dataset::Dataset;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub schema: Vec<FieldInfo>,
    pub num_rows: usize,
    pub num_columns: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FieldInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageData {
    pub rows: Vec<HashMap<String, serde_json::Value>>,
    pub total_rows: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
}

#[tauri::command]
pub async fn list_lance_tables(directory: String) -> Result<Vec<String>, String> {
    let dir_path = Path::new(&directory);
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", directory));
    }

    let mut tables = Vec::new();

    // Walk through directory to find lance datasets
    if let Ok(entries) = std::fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                // Check if it's a lance dataset by trying to open it
                if let Ok(_) = Dataset::open(&path.to_string_lossy()).await {
                    if let Some(name) = path.file_name() {
                        tables.push(name.to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    Ok(tables)
}

#[tauri::command]
pub async fn get_table_info(directory: String, table_name: String) -> Result<TableInfo, String> {
    let dataset_path = Path::new(&directory).join(&table_name);
    let dataset_uri = dataset_path.to_string_lossy();

    let dataset = Dataset::open(&dataset_uri)
        .await
        .map_err(|e| format!("Failed to open dataset: {}", e))?;

    let schema = dataset.schema();
    let mut fields = Vec::new();

    for field in schema.fields.iter() {
        fields.push(FieldInfo {
            name: field.name.clone(),
            data_type: format!("{:?}", field.data_type()),
            nullable: field.nullable,
        });
    }

    Ok(TableInfo {
        name: table_name,
        schema: fields,
        num_rows: dataset.count_rows(None).await.unwrap_or(0),
        num_columns: schema.fields.len(),
    })
}

#[tauri::command]
pub async fn get_table_data(
    directory: String,
    table_name: String,
    page: usize,
    page_size: usize,
) -> Result<PageData, String> {
    let dataset_path = Path::new(&directory).join(&table_name);
    let dataset_uri = dataset_path.to_string_lossy();

    let dataset = Dataset::open(&dataset_uri)
        .await
        .map_err(|e| format!("Failed to open dataset: {}", e))?;

    let total_rows = dataset.count_rows(None).await.unwrap_or(0);
    let total_pages = if page_size > 0 {
        (total_rows + page_size - 1) / page_size
    } else {
        0
    };

    // Use scan with limit and offset
    let mut scanner = dataset.scan();
    scanner
        .limit(Some(page_size as i64), Some((page * page_size) as i64))
        .map_err(|e| format!("Failed to set limit/offset: {}", e))?;

    let stream = scanner
        .try_into_stream()
        .await
        .map_err(|e| format!("Failed to create scanner: {}", e))?;

    let mut rows = Vec::new();

    // Process stream
    let mut stream = stream;
    while let Some(batch) = stream
        .try_next()
        .await
        .map_err(|e| format!("Failed to read batch: {}", e))?
    {
        for row_idx in 0..batch.num_rows() {
            let mut row_data = HashMap::new();
            for (col_idx, field) in batch.schema().fields().iter().enumerate() {
                let column = batch.column(col_idx);
                // Convert to string representation
                let value_str = format!("{:?}", column);
                row_data.insert(field.name().clone(), serde_json::Value::String(value_str));
            }
            rows.push(row_data);
        }
    }

    Ok(PageData {
        rows,
        total_rows,
        page,
        page_size,
        total_pages,
    })
}
