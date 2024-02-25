use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, RequestExt, Response};
use rusoto_s3::{S3, S3Client, GetObjectRequest};
use lambda_http::Body as LambdaBody;
use tokio::io::AsyncReadExt;
use base64::encode;
use lambda_http::http::header::{HeaderValue, CONTENT_TYPE};
use lambda_http::http::StatusCode;

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Error> {
    let model = event
        .path_parameters_ref()
        .and_then(|params| params.first("model"))
        .unwrap_or("default");
    let image = event
        .path_parameters_ref()
        .and_then(|params| params.first("image"))
        .unwrap_or("default");
    
    let s3_client = S3Client::new(Default::default());
    let bucket = "datasetcolab";
    let key = format!("models/{}/images/processed_{}.jpg", model, image);
    let request = GetObjectRequest {
        bucket: bucket.to_string(),
        key: key.to_string(),
        ..Default::default()
    };
    let response = s3_client.get_object(request).await?;

    let body = response.body.unwrap();
    let mut body_bytes = Vec::new();
    body.into_async_read().read_to_end(&mut body_bytes).await?;

    let base64_encoded_body = encode(&body_bytes);

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, HeaderValue::from_static("image/jpeg"))
        .body(LambdaBody::from(base64_encoded_body))
        .map_err(Error::from)?)
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