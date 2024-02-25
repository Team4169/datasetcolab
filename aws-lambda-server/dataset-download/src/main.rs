use aws_config::meta::region::RegionProviderChain;
use aws_sdk_s3::presigning::{PresigningConfig};
use aws_sdk_s3::{config::Region, Client};
use std::error::Error;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    tracing_subscriber::fmt::init();

    let region: Option<String> = Some(String::from("us-east-1"));
    let bucket: String = String::from("datasetcolab");
    let object: String = String::from("download/2m70.zip");
    let expires_in: u64 = 900;

    let region_provider = RegionProviderChain::first_try(region.map(Region::new))
        .or_default_provider()
        .or_else(Region::new("us-east-1"));
    let shared_config = aws_config::from_env().region(region_provider).load().await;
    let client = Client::new(&shared_config);

    let expires_in = Duration::from_secs(expires_in);

    let presigned_request = client
        .put_object()
        .bucket(bucket)
        .key(object)
        .presigned(PresigningConfig::expires_in(expires_in)?)
        .await?;

    println!("Object URI: {}", presigned_request.uri());
    Ok(())
}