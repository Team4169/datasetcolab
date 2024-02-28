use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, RequestExt, Response};
use lambda_http::Body as LambdaBody;
use rusoto_core::Region;
use rusoto_s3::{S3, S3Client, PutObjectRequest};
use rusoto_dynamodb::{DynamoDb, DynamoDbClient, PutItemInput, AttributeValue};
use std::time::SystemTime;
use std::collections::HashMap;
use lambda_http::http::header::HeaderValue;
use lambda_http::http::header::HeaderMap;

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Error> {
    let user_name = event
        .path_parameters_ref()
        .and_then(|params| params.first("user"))
        .unwrap_or("default");
    let repository_name = event
        .path_parameters_ref()
        .and_then(|params| params.first("repo"))
        .unwrap_or("default");

    let headers: &HeaderMap<HeaderValue> = event.headers();
    let description = headers
        .get("description")
        .and_then(|value| value.to_str().ok())
        .unwrap_or("No description header found");
    let tags = headers
        .get("tags")
        .and_then(|value| value.to_str().ok())
        .unwrap_or("No tags header found");
    

    let s3_client = S3Client::new(Default::default());
    let bucket = "datasetcolab2";
    let folder_key = format!("{}/{}/", user_name, repository_name);
    let put_object_request_datasets = PutObjectRequest {
        bucket: bucket.to_string(),
        key: format!("{}datasets/", folder_key),
        ..Default::default()
    };
    let put_object_request_models = PutObjectRequest {
        bucket: bucket.to_string(),
        key: format!("{}models/", folder_key),
        ..Default::default()
    };
    let put_object_request_downloads = PutObjectRequest {
        bucket: bucket.to_string(),
        key: format!("{}downloads/", folder_key),
        ..Default::default()
    };
    s3_client.put_object(put_object_request_datasets).await?;
    s3_client.put_object(put_object_request_models).await?;
    s3_client.put_object(put_object_request_downloads).await?;
    let dynamodb_client = DynamoDbClient::new(Region::default());
    let table_name = "repositories";
    let current_time = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let mut item = HashMap::new();
    item.insert("full_name".to_string(), AttributeValue {
        s: Some(user_name.to_string() + "/" + repository_name),
        ..Default::default()
    });
    item.insert("user_name".to_string(), AttributeValue {
        s: Some(user_name.to_string()),
        ..Default::default()
    });
    item.insert("repository_name".to_string(), AttributeValue {
        s: Some(repository_name.to_string()),
        ..Default::default()
    });
    item.insert("creation_time".to_string(), AttributeValue {
        n: Some(current_time.to_string()),
        ..Default::default()
    });
    item.insert("description".to_string(), AttributeValue {
        s: Some(description.to_string()),
        ..Default::default()
    });
    item.insert("visibility".to_string(), AttributeValue {
        s: Some("public".to_string()),
        ..Default::default()
    });
    let mut collaborators = Vec::new();
    collaborators.push(user_name.to_string());
    item.insert("collaborators".to_string(), AttributeValue {
        s: Some(serde_json::to_string(&collaborators).unwrap()),
        ..Default::default()
    });
    let mut changelog = Vec::new();
    changelog.push(format!("Repository created by {}", user_name));
    item.insert("changelog".to_string(), AttributeValue {
        s: Some(serde_json::to_string(&changelog).unwrap()),
        ..Default::default()
    });
    item.insert("tags".to_string(), AttributeValue {
        s: Some(tags.to_string()),
        ..Default::default()
    });
    item.insert("datasets".to_string(), AttributeValue {
        s: Some("{\"datasets\":[]}".to_string()),
        ..Default::default()
    });
    item.insert("models".to_string(), AttributeValue {
        s: Some("{\"models\":[]}".to_string()),
        ..Default::default()
    });
    item.insert("downloads".to_string(), AttributeValue {
        s: Some("{\"downloads\":[]}".to_string()),
        ..Default::default()
    });
    let put_item_input = PutItemInput {
        table_name: table_name.to_string(),
        item: item,
        ..Default::default()

    };
    dynamodb_client.put_item(put_item_input).await?;

    Ok(Response::builder()
        .status(200)
        .body(LambdaBody::from("Repository created"))?)
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
