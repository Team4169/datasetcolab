use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Body, Error, Request, RequestExt, Response};
use rusoto_s3::{S3, S3Client, GetObjectRequest};
use csv;
use serde_json;

async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    let model = event
        .path_parameters_ref()
        .and_then(|params| params.first("model"))
        .unwrap_or("default");
    let project = event
        .path_parameters_ref()
        .and_then(|params| params.first("project"))
        .unwrap_or("default");
    let message = format!("Model: {}, Project: {}", model, project);

    let s3_client = S3Client::new(Default::default());
    let bucket = "datasetcolab";
    let key = format!("models/{}/results.csv", model);
    let request = GetObjectRequest {
        bucket: bucket.to_string(),
        key: key.to_string(),
        ..Default::default()
    };
    let response = s3_client.get_object(request).await?;
    let content_type = response.content_type.unwrap_or_default();
    let body = response.body.unwrap_or_default();

    // Process CSV data to find maximum value in each column
    let mut csv_reader = csv::Reader::from_reader(body.as_slice());
    let headers = csv_reader.headers()?.clone();
    let mut max_values = vec![f64::NEG_INFINITY; headers.len()];
    for result in csv_reader.records() {
        let record = result?;
        for (i, value) in record.iter().enumerate() {
            if let Ok(numeric_value) = value.parse::<f64>() {
                max_values[i] = max_values[i].max(numeric_value);
            }
        }
    }

    // Create JSON response with headers and maximum values
    let mut json_response = serde_json::Map::new();
    for (header, max_value) in headers.iter().zip(max_values) {
        json_response.insert(header.trim().to_string(), serde_json::Value::Number(max_value.into()));
    }

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&json_response)?.into())
        .map_err(Box::new)?)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env_lossy(),
        )
        .with_target(false)
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}