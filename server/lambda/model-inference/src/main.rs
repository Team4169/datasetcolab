use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, Response};
use lambda_http::Body;
use onnxruntime::{environment::Environment, GraphOptimizationLevel, LoggingLevel, session::{Session, SessionOptions}};
use std::path::Path;

async fn function_handler(_event: Request) -> Result<Response<Body>, Error> {
    let environment = Environment::builder()
        .with_name("onnxruntime_image_inference_example")
        .with_log_level(LoggingLevel::Verbose)
        .build()
        .unwrap();

    let model_path = Path::new("best2.onnx");

    // Create session options
    let options = SessionOptions::new()
        .with_environment(environment)
        .with_model_from_file(model_path)
        .with_optimization_level(GraphOptimizationLevel::Basic)
        .unwrap();

    // Create the session
    let session = Session::new(options).unwrap();

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(Body::from("Hello, World!"))
        .expect("Failed to construct response"))
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
