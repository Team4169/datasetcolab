use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, RequestExt, Response};
use lambda_http::Body as LambdaBody;
use rusoto_core::Region;
use rusoto_dynamodb::{DynamoDb, DynamoDbClient, AttributeValue, ScanInput};
use std::collections::HashMap;

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Error> {
    let user_name = event
        .path_parameters_ref()
        .and_then(|params| params.first("user"))
        .unwrap_or("default");
    let repository_name = event
        .path_parameters_ref()
        .and_then(|params| params.first("repo"))
        .unwrap_or("default");

    let dynamodb_client = DynamoDbClient::new(Region::default());
    let table_name = "repositories";
    let full_name = format!("{}/{}", user_name, repository_name);
    let mut scan_input = ScanInput::default();
    scan_input.table_name = table_name.to_string();
    scan_input.expression_attribute_values = Some({
        let mut attribute_values = HashMap::new();
        attribute_values.insert(":full_name".to_string(), AttributeValue {
            s: Some(full_name.clone()),
            ..Default::default()
        });
        attribute_values
    });
    scan_input.filter_expression = Some("full_name = :full_name".to_string());

    let scan_result = dynamodb_client.scan(scan_input).await?;
    let items = scan_result.items.unwrap_or_default();

    if items.is_empty() {
        let response_body = "Repository does not exist";
        let response = Response::builder()
            .status(404)
            .body(response_body.into())
            .expect("Failed to build response");
        Ok(response)
    } else {
        let response_body = "Repository exists";
        let response = Response::builder()
            .status(200)
            .body(response_body.into())
            .expect("Failed to build response");
        Ok(response)
    }
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
