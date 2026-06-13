use arrow::array::{Array, BooleanArray, Float32Array, Float64Array, Int16Array, Int32Array, Int64Array, Int8Array, LargeStringArray, StringArray, UInt16Array, UInt32Array, UInt64Array, UInt8Array};
use arrow::datatypes::DataType;
use arrow::record_batch::RecordBatch;
use datafusion::prelude::*;
use futures_util::stream::TryStreamExt;
use lance::dataset::Dataset;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct SqlResult {
    pub rows: Vec<HashMap<String, serde_json::Value>>,
    pub columns: Vec<String>,
    pub total_rows: usize,
}

/// 校验 `sub` 不会逃逸出 `base` 目录。
fn validate_path(base: &Path, sub: &str) -> Result<PathBuf, String> {
    let canonical_base = base
        .canonicalize()
        .map_err(|e| format!("Invalid directory: {}", e))?;
    let joined = canonical_base.join(sub);
    let canonical_joined = joined.canonicalize().unwrap_or(joined.clone());

    if !canonical_joined.starts_with(&canonical_base) {
        return Err("Invalid path: traversal detected".to_string());
    }
    Ok(joined)
}

fn is_lance_dataset(path: &Path) -> bool {
    path.is_dir() && path.join("_latest.manifest").exists()
}

#[tauri::command]
pub async fn list_lance_tables(directory: String) -> Result<Vec<String>, String> {
    let dir_path = Path::new(&directory);
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", directory));
    }

    let mut tables = Vec::new();
    if let Ok(entries) = std::fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if is_lance_dataset(&path) {
                if let Some(name) = path.file_name() {
                    tables.push(name.to_string_lossy().to_string());
                }
            }
        }
    }

    Ok(tables)
}

#[tauri::command]
pub async fn get_table_info(directory: String, table_name: String) -> Result<TableInfo, String> {
    let dataset_path = validate_path(Path::new(&directory), &table_name)?;
    let dataset_uri = dataset_path.to_string_lossy();

    let dataset = Dataset::open(&dataset_uri)
        .await
        .map_err(|e| format!("Failed to open dataset: {}", e))?;

    let schema = dataset.schema();
    let fields: Vec<FieldInfo> = schema
        .fields
        .iter()
        .map(|field| FieldInfo {
            name: field.name.clone(),
            data_type: format!("{:?}", field.data_type()),
            nullable: field.nullable,
        })
        .collect();

    let num_rows = dataset
        .count_rows(None)
        .await
        .map_err(|e| format!("Failed to count rows: {}", e))?;

    Ok(TableInfo {
        name: table_name,
        schema: fields,
        num_rows,
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
    let dataset_path = validate_path(Path::new(&directory), &table_name)?;
    let dataset_uri = dataset_path.to_string_lossy();

    let dataset = Dataset::open(&dataset_uri)
        .await
        .map_err(|e| format!("Failed to open dataset: {}", e))?;

    let total_rows = dataset
        .count_rows(None)
        .await
        .map_err(|e| format!("Failed to count rows: {}", e))?;

    let total_pages = if page_size > 0 {
        total_rows.div_ceil(page_size)
    } else {
        0
    };

    let mut scanner = dataset.scan();
    scanner
        .limit(Some(page_size as i64), Some((page * page_size) as i64))
        .map_err(|e| format!("Failed to set limit/offset: {}", e))?;

    let stream = scanner
        .try_into_stream()
        .await
        .map_err(|e| format!("Failed to create scanner: {}", e))?;

    let mut stream = stream;
    let mut rows = Vec::new();

    while let Some(batch) = stream
        .try_next()
        .await
        .map_err(|e| format!("Failed to read batch: {}", e))?
    {
        rows.extend(record_batch_to_rows(&batch));
    }

    Ok(PageData {
        rows,
        total_rows,
        page,
        page_size,
        total_pages,
    })
}

#[tauri::command]
pub async fn execute_lance_sql(directory: String, sql: String) -> Result<SqlResult, String> {
    let dir_path = Path::new(&directory);
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", directory));
    }

    let ctx = SessionContext::new();
    let mut table_names = Vec::new();

    if let Ok(entries) = std::fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if is_lance_dataset(&path) {
                let path_str = path.to_string_lossy().to_string();
                let dataset = Dataset::open(&path_str)
                    .await
                    .map_err(|e| format!("Failed to open dataset {}: {}", path_str, e))?;

                if let Some(name) = path.file_name() {
                    let table_name = name.to_string_lossy().to_string();
                    ctx.register_table(
                        &table_name,
                        Arc::new(dataset) as Arc<dyn datafusion::datasource::TableProvider>,
                    )
                    .map_err(|e| format!("Failed to register table {}: {}", table_name, e))?;
                    table_names.push(table_name);
                }
            }
        }
    }

    if table_names.is_empty() {
        return Err("No lance tables found in directory".to_string());
    }

    let df = ctx
        .sql(&sql)
        .await
        .map_err(|e| format!("SQL execution failed: {}", e))?;

    let batches = df
        .collect()
        .await
        .map_err(|e| format!("Failed to collect results: {}", e))?;

    let mut all_rows: Vec<HashMap<String, serde_json::Value>> = Vec::new();
    let mut columns: Vec<String> = Vec::new();

    for batch in &batches {
        if columns.is_empty() {
            columns = batch
                .schema()
                .fields()
                .iter()
                .map(|f| f.name().clone())
                .collect();
        }
        all_rows.extend(record_batch_to_rows(batch));
    }

    let total_rows = all_rows.len();

    Ok(SqlResult {
        rows: all_rows,
        columns,
        total_rows,
    })
}

/// 将 RecordBatch 按行转换为 HashMap 列表。
fn record_batch_to_rows(batch: &RecordBatch) -> Vec<HashMap<String, serde_json::Value>> {
    let num_rows = batch.num_rows();
    let mut rows: Vec<HashMap<String, serde_json::Value>> =
        (0..num_rows).map(|_| HashMap::new()).collect();

    for (col_idx, field) in batch.schema().fields().iter().enumerate() {
        let column = batch.column(col_idx);
        for (row_idx, row) in rows.iter_mut().enumerate().take(num_rows) {
            let value = array_value_to_json(column, row_idx);
            row.insert(field.name().clone(), value);
        }
    }

    rows
}

/// 将 Arrow 数组中的某个值转换为 serde_json::Value。
fn array_value_to_json(array: &dyn Array, row_idx: usize) -> serde_json::Value {
    if array.is_null(row_idx) {
        return serde_json::Value::Null;
    }

    macro_rules! downcast_value {
        ($array:expr, $ty:ty) => {
            $array
                .as_any()
                .downcast_ref::<$ty>()
                .unwrap()
                .value(row_idx)
        };
    }

    match array.data_type() {
        DataType::Int8 => json!(downcast_value!(array, Int8Array)),
        DataType::Int16 => json!(downcast_value!(array, Int16Array)),
        DataType::Int32 => json!(downcast_value!(array, Int32Array)),
        DataType::Int64 => json!(downcast_value!(array, Int64Array)),
        DataType::UInt8 => json!(downcast_value!(array, UInt8Array)),
        DataType::UInt16 => json!(downcast_value!(array, UInt16Array)),
        DataType::UInt32 => json!(downcast_value!(array, UInt32Array)),
        DataType::UInt64 => json!(downcast_value!(array, UInt64Array)),
        DataType::Float32 => json!(downcast_value!(array, Float32Array)),
        DataType::Float64 => json!(downcast_value!(array, Float64Array)),
        DataType::Boolean => json!(downcast_value!(array, BooleanArray)),
        DataType::Utf8 => json!(downcast_value!(array, StringArray)),
        DataType::LargeUtf8 => json!(downcast_value!(array, LargeStringArray)),
        _ => serde_json::Value::String(format!("{:?}", array)),
    }
}
