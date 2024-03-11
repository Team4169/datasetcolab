use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, Response};
use lambda_http::Body as LambdaBody;
use rusoto_core::Region;
use rusoto_dynamodb::{DynamoDb, DynamoDbClient, GetItemInput, PutItemInput, AttributeValue};
use std::collections::HashMap;
use lambda_http::http::header::HeaderValue;
use lambda_http::http::header::HeaderMap;
use rand::Rng;
use maplit::hashmap;

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Error> {
    let headers: &HeaderMap<HeaderValue> = event.headers();
    let new = headers
        .get("new")
        .and_then(|value| value.to_str().ok())
        .unwrap_or("No new header found");
    let uid = headers
        .get("uid")
        .and_then(|value| value.to_str().ok())
        .unwrap_or("No uid header found");

    let dynamodb_client = DynamoDbClient::new(Region::default());
    let table_name = "api";
    let get_item_input = GetItemInput {
        table_name: table_name.to_string(),
        key: hashmap! {
            "uid".to_string() => AttributeValue {
                s: Some(uid.to_string()),
                ..Default::default()
            }
        },
        ..Default::default()
    };
    let result = dynamodb_client.get_item(get_item_input).await;
    println!("result {:?}", result);

    let item = result.unwrap();
    if new == "true" || !item.item.is_some() {
        let new_key = generate_random_combination(8);
        let mut updated_item = HashMap::new();
        updated_item.insert("uid".to_string(), AttributeValue {
            s: Some(uid.to_string()),
            ..Default::default()
        });
        updated_item.insert("key".to_string(), AttributeValue {
            s: Some(new_key.clone()),
            ..Default::default()
        });
        let put_item_input = PutItemInput {
            table_name: table_name.to_string(),
            item: updated_item,
            ..Default::default()
        };
        dynamodb_client.put_item(put_item_input).await?;
        Ok(Response::builder()
            .status(200)
            .body(LambdaBody::from(new_key))
            .expect("Failed to render response"))
    } else {
        let key = item.item.unwrap().get("key").and_then(|attr| attr.s.clone()).unwrap();
        Ok(Response::builder()
            .status(200)
            .body(LambdaBody::from(key))
            .expect("Failed to render response"))
    }
}

fn generate_random_combination(length: usize) -> String {
    let mut rng = rand::thread_rng();
    let combination: String = (0..length)
        .map(|_| {
            let random_char = rng.gen_range(b'A'..=b'Z') as char;
            let random_digit = rng.gen_range(b'0'..=b'9') as char;
            if rng.gen_bool(0.5) {
                random_char.to_string()
            } else {
                random_digit.to_string()
            }
        })
        .collect();
    combination
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
