use aws_sdk_s3::presigning::{PresignedRequest, PresigningConfig};
use aws_sdk_s3::{config::Region, Client};
use std::error::Error;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let region = Some("us-west-2".to_string());
    let body = "Hello, world!".to_string();
    let bucket = "my-bucket".to_string();
    let object = "my-object".to_string();
    let expires_in = 900;
    let verbose = true;

    let shared_config = aws_config::from_env().region(region.map(Region::new)).load().await;
    let client = Client::new(&shared_config);

    if verbose {
        println!("Bucket:            {}", &bucket);
        println!("Object:            {}", &object);
        println!("Body:              {}", &body);
        println!("Expires in:        {} seconds", expires_in);
        println!();
    }

    let expires_in = Duration::from_secs(expires_in);

    let presigned_request = client
        .put_object()
        .bucket(bucket)
        .key(object)
        .presigned(PresigningConfig::expires_in(expires_in)?)
        .await?;


    warp::serve(function_handler).run(([127, 0, 0, 1], 3030)).await;
}