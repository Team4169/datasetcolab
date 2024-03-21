use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, Response};
use lambda_http::Body;
use onnxruntime::{environment::Environment, GraphOptimizationLevel, LoggingLevel, tensor::OrtOwnedTensor, ndarray::Array};
use std::fs::read;

async fn function_handler(_event: Request) -> Result<Response<Body>, Error> {
    let environment = Environment::builder()
        .with_name("onnxruntime_image_inference_example")
        .with_log_level(LoggingLevel::Verbose)
        .build()?;

    let mut session = environment
        .new_session_builder()?
        .with_optimization_level(GraphOptimizationLevel::Basic)?
        .with_number_threads(1)?
        .with_model_from_file("best2.onnx")?;

    let image_data = read("am-4999.jpg").expect("Failed to read image file");
    

    /*
    let input_tensor = OrtOwnedTensor::from(Array::from(image_data).into_dyn());
    let outputs: Vec<OrtOwnedTensor<f32, _>> = session.run(vec![input_tensor])?;
        

    for output in outputs {
        println!("{:?}", output);
    }
    */

    Ok(Response::builder()
        .status(200)
        .body(Body::from("Hello, World!"))
        .expect("Failed to render response"))
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
