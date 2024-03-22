use std::process::Command;
use rusoto_core::Region;
use rusoto_s3::{PutObjectRequest, util::PreSignedRequest};
use rusoto_dynamodb::{DynamoDb, DynamoDbClient, PutItemInput, GetItemInput, DeleteItemInput, AttributeValue};
use rusoto_credential::{DefaultCredentialsProvider, ProvideAwsCredentials};
use std::collections::HashMap;
use tokio::runtime::Runtime;
use maplit::hashmap;

fn main() {
    let output = Command::new("cat")
        .arg("/proc/self/cgroup")
        .output()
        .expect("Failed to execute command");

    let container_info = String::from_utf8_lossy(&output.stdout);
    let system_name = container_info.split('/').last().unwrap().split('-').next().unwrap();

    let client = DynamoDbClient::new(Region::default());

    let get_item_input = GetItemInput {
        table_name: "upload".to_string(),
        key: hashmap!{
            "id".to_string() => AttributeValue {
                s: Some(system_name.to_string()),
                ..Default::default()
            }
        },
        ..Default::default()
    };

    let mut rt = Runtime::new().unwrap();
    let get_item_output = rt.block_on(client.get_item(get_item_input)).expect("Failed to get item");
    let item = get_item_output.item.expect("Item not found");

    let roboflow_export_link = item.get("roboflow_export_link").unwrap().s.as_ref().unwrap();
    let file_key = item.get("file_key").unwrap().s.as_ref().unwrap();

    let delete_item_input = DeleteItemInput {
        table_name: "upload".to_string(),
        key: hashmap!{
            "id".to_string() => AttributeValue {
                s: Some(system_name.to_string()),
                ..Default::default()
            }
        },
        ..Default::default()
    };

    let _delete_item_output = rt.block_on(client.delete_item(delete_item_input)).expect("Failed to delete item");
}
