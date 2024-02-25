use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, RequestExt, Response};
use lambda_http::Body as LambdaBody;
use rusoto_s3::{S3, S3Client, GetObjectRequest};
use tokio::io::AsyncReadExt;
use csv::ReaderBuilder;
use serde_json::{json, Value};

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Error> {
    let model = event
        .path_parameters_ref()
        .and_then(|params| params.first("model"))
        .unwrap_or("default");

    /*
    let project = event
        .path_parameters_ref()
        .and_then(|params| params.first("project"))
        .unwrap_or("default");
    */

    let s3_client = S3Client::new(Default::default());
    let bucket = "datasetcolab";
    let key = format!("models/{}/results.csv", model);
    let request = GetObjectRequest {
        bucket: bucket.to_string(),
        key: key.to_string(),
        ..Default::default()
    };
    let response = s3_client.get_object(request).await?;

    let mut body_text = String::new();
    let mut async_read = response.body.unwrap().into_async_read();
    async_read.read_to_string(&mut body_text).await?;

    let mut csv_reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(body_text.as_bytes());
    
    let keys = csv_reader.headers()?.clone();
    let mut last_row: Option<Vec<String>> = None;
    for result in csv_reader.records() {
        last_row = Some(result?.iter().map(|s| s.trim().to_owned()).collect());
    }
    let values = last_row.unwrap_or_default();

    let mut json_object = json!({});
    for (key, value) in keys.iter().zip(values.iter()) {
        json_object[key.trim()] = Value::String(value.trim().to_owned());
    }
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(LambdaBody::from(json_object.to_string()))
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