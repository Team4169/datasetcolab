/*
future improvements:
- get possible versions function (so it doesn't automatically select the latest version)
*/

use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, Response, RequestExt};
use lambda_http::Body as LambdaBody;
use rusoto_core::Region;
use rusoto_s3::{PutObjectRequest, util::PreSignedRequest};
use rusoto_dynamodb::{DynamoDb, DynamoDbClient, PutItemInput, AttributeValue};
use rusoto_secretsmanager::{SecretsManager, SecretsManagerClient, GetSecretValueRequest};
use rusoto_ecs::{Ecs, EcsClient, RunTaskRequest, NetworkConfiguration, AwsVpcConfiguration};
use rusoto_credential::{DefaultCredentialsProvider, ProvideAwsCredentials};
use std::collections::HashMap;
use lambda_http::http::header::{HeaderValue, HeaderMap};
use url::Url;
use reqwest;
use serde_json::Value;
use rand::Rng;

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
    let roboflow_url = headers
        .get("roboflow_url")
        .and_then(|value| value.to_str().ok())
        .unwrap_or("no_roboflow_url_provided");
    if roboflow_url == "no_roboflow_url_provided" {
        let bucket_name = "datasetcolab2";
        let dataset_id = generate_random_combination();
        let object_key = format!("{}/{}/datasets/{}/", user_name, repository_name, dataset_id);
        println!("object_key {:?}", object_key);
      
        let upload_request = PutObjectRequest {
            bucket: bucket_name.to_string(),
            key: object_key.to_string(),
            ..Default::default()
        };

        let presigned_url = match DefaultCredentialsProvider::new() {
            Ok(credentials_provider) => {
                let credentials = credentials_provider.credentials().await.unwrap();
                upload_request.get_presigned_url(
                    &Region::default(),
                    &credentials,
                    &Default::default(),
                )
            },
            Err(error) => {
                eprintln!("Unable to get AWS credentials: {:?}", error);
                return Ok(Response::builder().status(500).body("Internal Server Error".into())?);
            }
        };

        return Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(LambdaBody::from(serde_json::json!({
                "presigned_url": presigned_url,
                "object_key": object_key,
            }).to_string()))
            .map_err(Box::new)?);
    } else {
        let api_key = get_roboflow_secret().await?;
        let (workspace, project) = parse_roboflow_url(roboflow_url);
    
        let version_id_url = format!("https://api.roboflow.com/{}/{}/?api_key={}", workspace, project, api_key);
        let response = reqwest::get(&version_id_url).await?;
        let body = response.text().await?;
        let json: Value = serde_json::from_str(&body)?;
        let versions_array = json.get("versions").and_then(|value| value.as_array()).ok_or("Invalid JSON format")?;
        let latest_version = versions_array.get(0).and_then(|value| value.as_object()).ok_or("Invalid JSON format")?;
        let version_id = latest_version.get("id").and_then(|value| value.as_str()).ok_or("Version ID not found")?.to_string();
    
        let project_info_url = format!("https://api.roboflow.com/{}/coco?api_key={}", version_id, api_key);
        let response = reqwest::get(&project_info_url).await?;
        let body = response.text().await?;
        let json: Value = serde_json::from_str(&body)?;
        println!("project_info_url {:?}", json);
        let export = json.get("export").and_then(|value| value.as_object()).ok_or("Invalid JSON format")?;
        let export_link = export.get("link").and_then(|value| value.as_str()).ok_or("Export link not found")?.to_string();
        let export_size = export.get("size").and_then(|value| value.as_f64()).ok_or("Export size not found").unwrap();

        let ecs_client = EcsClient::new(Region::default());
        let ecs_request = RunTaskRequest {
            cluster: Some("dataset-upload-cluster".to_string()),
            task_definition: "dataset-upload-task".to_string(),
            launch_type: Some("FARGATE".to_string()),
            network_configuration: Some(NetworkConfiguration {
                awsvpc_configuration: Some(AwsVpcConfiguration {
                    subnets: vec!["subnet-0ce18eca13acc78cd".to_string()],
                    assign_public_ip: Some("ENABLED".to_string()),
                    ..Default::default()
                }),
                ..Default::default()
            }),
            ..Default::default()
        };
        let ecs_response = ecs_client.run_task(ecs_request).await.unwrap();
        println!("ecs_response {:?}", ecs_response);
    
        let task_arn = ecs_response.tasks.unwrap().get(0).and_then(|task| task.task_arn.clone()).unwrap_or("".to_string());
        let task_id = task_arn.split("/").last().unwrap_or("").to_string();
        println!("task_id {:?}", task_id);

        let dynamodb_client = DynamoDbClient::new(Region::default());
        let table_name = "upload";
        let mut item = HashMap::new();
        item.insert("id".to_string(), AttributeValue {
            s: Some(task_id.to_string()),
            ..Default::default()
        });
        item.insert("roboflow_export_link".to_string(), AttributeValue {
            s: Some(export_link.to_string()),
            ..Default::default()
        });
        item.insert("file_key".to_string(), AttributeValue {
            s: Some(format!("{}/{}/datasets/{}/", user_name, repository_name, task_id)),
            ..Default::default()
        });
        let put_item_input = PutItemInput {
            table_name: table_name.to_string(),
            item: item,
            ..Default::default()

        };
        dynamodb_client.put_item(put_item_input).await?;

        return Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(LambdaBody::from(serde_json::json!({
                "task_id": task_id,
                "export_size": export_size,
            }).to_string()))
            .map_err(Box::new)?);
    }

    /*
    let dynamodb_client = DynamoDbClient::new(Region::default());
    let table_name = "repositories";
    let full_name = format!("{}/{}", user_name, repository_name);
    let repository = dynamodb_client.get_item(GetItemInput {
        table_name: table_name.to_string(),
        key: {
            let mut key = HashMap::new();
            key.insert("full_name".to_string(), AttributeValue {
                s: Some(full_name.to_string()),
                ..Default::default()
            });
            key
        },
        ..Default::default()
    }).await?;
    println!("repository {:?}", repository);

    let cloned_item = repository.item.clone();
    let new_dataset_attribute = cloned_item.and_then(|item| item.get("datasets")).and_then(|attribute| attribute.s.clone());
    let mut datasets: Vec<Value> = new_dataset_attribute.and_then(|attribute| serde_json::from_str(&attribute).ok()).unwrap_or_default();

    let new_dataset = serde_json::json!({
        "dataset_id": dataset_id,
        "workspace": workspace,
        "project": project,
        "version_id": version_id,
        "export_size": export_size,
    });

    let new_dataset_attribute = AttributeValue {
        s: Some(new_dataset.to_string()),
        ..Default::default()
    };

    let new_dataset_value: Value = serde_json::from_str(&new_dataset_attribute.s.unwrap()).unwrap();
    datasets.push(new_dataset_value);

    let update_item_input = PutItemInput {
        table_name: table_name.to_string(),
        item: {
            let mut item = HashMap::new();
            item.insert("full_name".to_string(), AttributeValue {
                s: Some(full_name.to_string()),
                ..Default::default()
            });
            item.insert("datasets".to_string(), AttributeValue {
                s: Some(serde_json::to_string(&new_dataset)?),
                ..Default::default()
            });
            item
        },
        ..Default::default()
    };

    dynamodb_client.put_item(update_item_input).await?;
    */
}

fn generate_random_combination() -> String {
    let mut rng = rand::thread_rng();
    let combination: String = (0..6)
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

fn parse_roboflow_url(roboflow_url: &str) -> (String, String) {
    let url = Url::parse(roboflow_url).unwrap_or_else(|_| Url::parse(&format!("https://{}", roboflow_url)).unwrap());
    let host = url.host_str().unwrap_or("");
    let path_segments: Vec<&str> = url.path_segments().unwrap().collect::<Vec<_>>();

    let workspace = if path_segments.len() >= 2 {
        path_segments[0].to_string()
    } else {
        host.to_string()
    };

    let project = if path_segments.len() >= 2 {
        path_segments[1].to_string()
    } else {
        "".to_string()
    };

    (workspace, project)
}

async fn get_roboflow_secret() -> Result<String, Error> {
    let secret_name = "RoboflowAPI";

    let client = SecretsManagerClient::new(Region::UsEast1);
    let request = GetSecretValueRequest {
        secret_id: secret_name.to_string(),
        ..Default::default()
    };

    let response = client.get_secret_value(request).await?;
    let secret_string = response.secret_string.ok_or("Secret string not found")?;
    let secret_json: serde_json::Value = serde_json::from_str(&secret_string)?;
    let roboflow_api = secret_json["RoboflowAPI"].as_str().ok_or("RoboflowAPI not found")?.to_string();
    Ok(roboflow_api)
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
