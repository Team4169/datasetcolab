use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Request, Response};
use lambda_http::Body as LambdaBody;
use aws_sdk_s3::presigning::{PresigningConfig};
use aws_sdk_s3::{config::Region, Client};
use aws_config::BehaviorVersion;
use std::error::Error;
use std::time::Duration;

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Box<dyn Error>> {
    let model = event.uri().path().trim_start_matches("/model/download/").trim_end_matches('?');
    let download_type = event.uri().query()
        .and_then(|query| {
            query.split('&')
                .find(|param| param.starts_with("downloadType="))
                .map(|param| param.trim_start_matches("downloadType="))
        })
        .unwrap_or_default();

    let region = Some("us-east-1".to_string());
    let bucket = "datasetcolab".to_string();
    let object = if model.contains("YOLO") {
        format!("models/{}/weights/best.pt", model)
    } else {
        format!("models/{}/{}{}.zip", model, model, download_type)
    };
    let expires_in = Duration::from_secs(900);

    let shared_config = aws_config::defaults(BehaviorVersion::latest())
        .region(region.map(Region::new))
        .load()
        .await;
    let client = Client::new(&shared_config);

    let presigned_request = client
        .get_object()
        .bucket(bucket)
        .key(object)
        .presigned(PresigningConfig::expires_in(expires_in)?)
        .await?;
    let redirect_url = presigned_request.uri().to_string();

    Ok(Response::builder()
        .status(302)
        .header("Location", redirect_url)
        .body(LambdaBody::Empty)
        .map_err(Box::new)?)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
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