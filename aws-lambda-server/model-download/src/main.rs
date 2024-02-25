use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, RequestExt, Response};
use rusoto_s3::{S3, S3Client, GetObjectRequest};
use lambda_http::Body as LambdaBody;
use rusoto_s3::GetObjectOutput;
use rusoto_s3::S3;
use std::convert::Infallible;
use std::error::Error;
use std::sync::Arc;
use warp::http::Response;
use warp::hyper::Body;
use warp::Filter;

async fn function_handler(event: Request) -> Result<Response<Body>, Infallible> {
    let model = event
        .path_parameters_ref()
        .and_then(|params| params.first("model"))
        .unwrap_or("default");
    println!("Event: {:?}", event);

    let s3_client = S3Client::new(Default::default());
    let bucket = "datasetcolab";
    let key = if model.contains("YOLO") {
        format!("models/{}/weights/best.pt", model)
    } else {
        format!("models/{}/weights/model.pth", model)
    };

    let request = GetObjectRequest {
        bucket: bucket.to_string(),
        key: key.to_string(),
        ..Default::default()
    };

    let response: Result<GetObjectOutput, rusoto_core::RusotoError<GetObjectError>> =
        s3_client.get_object(request).await;

    match response {
        Ok(output) => {
            let download_link = format!(
                "https://s3.amazonaws.com/{}/{}",
                bucket.to_string(),
                key.to_string()
            );
            Ok(Response::builder()
                .status(200)
                .header("Content-Type", "text/plain")
                .body(Body::from(download_link))
                .unwrap())
        }
        Err(err) => {
            eprintln!("Error: {:?}", err);
            Ok(Response::builder()
                .status(500)
                .header("Content-Type", "text/plain")
                .body(Body::from("Internal Server Error"))
                .unwrap())
        }
    }
}

#[tokio::main]
async fn main() {
    let function_handler = warp::any().map(move || {
        let function_handler = Arc::new(function_handler.clone());
        warp::any().and(warp::path::param()).and_then(move |event: Request| {
            let function_handler = function_handler.clone();
            async move {
                let response = function_handler(event).await;
                Ok::<_, Infallible>(response)
            }
        })
    });

    warp::serve(function_handler).run(([127, 0, 0, 1], 3030)).await;
}