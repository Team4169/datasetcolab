use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Request, Response};
use lambda_http::Body as LambdaBody;
use aws_sdk_s3::presigning::{PresigningConfig};
use aws_sdk_s3::{config::Region, Client};
use aws_config::BehaviorVersion;
use std::error::Error;
use std::time::Duration;

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Box<dyn Error>> {
    let idToken = event.uri().query()
        .and_then(|query| {
            query.split('&')
                .find(|param| param.starts_with("idToken="))
                .map(|param| param.trim_start_matches("idToken="))
        })
        .unwrap_or_else(|| {
            event.headers()
                .get("idToken")
                .and_then(|value| value.to_str().ok())
                .unwrap_or_default()
        });

    if idToken.is_empty() {
        let api = event.uri().query()
            .and_then(|query| {
                query.split('&')
                    .find(|param| param.starts_with("api="))
                    .map(|param| param.trim_start_matches("api="))
            })
            .unwrap_or_else(|| {
                event.headers()
                    .get("api")
                    .and_then(|value| value.to_str().ok())
                    .unwrap_or_default()
            });

        if api.is_empty() {
            return Ok(Response::builder()
                .status(400)
                .body(LambdaBody::from("Missing idToken and api"))
                .map_err(Box::new)?);
        } else {
            return Ok(Response::builder()
                .status(200)
                .body(LambdaBody::from(api))
                .map_err(Box::new)?);
        }
    } else {
        return Ok(Response::builder()
            .status(200)
            .body(LambdaBody::from(idToken))
            .map_err(Box::new)?);
    }
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