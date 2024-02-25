use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, RequestExt, Response};
use rusoto_s3::{S3, S3Client, GetObjectRequest};
use lambda_http::Body as LambdaBody;
use tokio::io::AsyncReadExt;
use csv::ReaderBuilder;
use serde_json::{json, Value};

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Error> {
    let dataset = event
        .path_parameters_ref()
        .and_then(|params| params.first("dataset"))
        .unwrap_or("default");

    let s3_client = S3Client::new(Default::default());
    let bucket = "datasetcolab";
    let key = if (dataset.contains("FRC")) {
        format!("download/{}/metadata.json", dataset)
    } else {
        format!("upload/{}/metadata.json", dataset)
    };
    let request = GetObjectRequest {
        bucket: bucket.to_string(),
        key: key.to_string(),
        ..Default::default()
    };
    let response = s3_client.get_object(request).await?;
    let mut body_text = String::new();
    
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(LambdaBody::from(body_text))
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