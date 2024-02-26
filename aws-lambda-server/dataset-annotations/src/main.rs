use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Error, Request, RequestExt, Response};
use lambda_http::Body as LambdaBody;
use rusoto_s3::{S3, S3Client, GetObjectRequest};
use tokio::io::AsyncReadExt;
use csv::ReaderBuilder;
use serde_json::{json, Value};

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Error> {
    let project = event
        .path_parameters_ref()
        .and_then(|params| params.first("project"))
        .unwrap_or("default");

    let gcp_service_account = CustomServiceAccount::from_json(&get_firebase_secret().await?).unwrap();
    let live_app = match App::live(gcp_service_account.into()).await {
        Ok(app) => app,
        Err(error) => {
            eprintln!("Error while creating live app: {:?}", error);
            return Ok(Response::builder()
                .status(500)
                .body(LambdaBody::from("Internal Server Error"))
                .map_err(Box::new)?);
        }
    };
    let live_token_verifier = live_app.id_token_verifier().await.unwrap();
    let uid = verify_token(&id_token, &live_token_verifier).await;

    let s3_client = S3Client::new(Default::default());
    let bucket = "datasetcolab";
    let key = if project.contains("FRC") {
        format!("download/", project)
    } else {
        format!("upload/{}/{}/annotations.json", uid, project)
    }
    let request = GetObjectRequest {
        bucket: bucket.to_string(),
        key: key.to_string(),
        ..Default::default()
    };
    let response = s3_client.get_object(request).await?;

    let mut body_text = String::new();
    let mut async_read = response.body.unwrap().into_async_read();
    async_read.read_to_string(&mut body_text).await?;

    let mut csv_reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(body_text.as_bytes());
    
    let keys = csv_reader.headers()?.clone();
    let mut last_row: Option<Vec<String>> = None;
    for result in csv_reader.records() {
        last_row = Some(result?.iter().map(|s| s.trim().to_owned()).collect());
    }
    let values = last_row.unwrap_or_default();

    let mut json_object = json!({});
    for (key, value) in keys.iter().zip(values.iter()) {
        json_object[key.trim()] = Value::String(value.trim().to_owned());
    }
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(LambdaBody::from(json_object.to_string()))
        .map_err(Box::new)?)
}

async fn get_firebase_secret() -> Result<String, Box<dyn Error>> {
    let secret_name = "FirebaseAdminDatasetColab";

    let client = SecretsManagerClient::new(RusotoRegion::UsEast1);
    let request = GetSecretValueRequest {
        secret_id: secret_name.to_string(),
        ..Default::default()
    };

    let response = client.get_secret_value(request).await?;
    let secret_string = response.secret_string.ok_or("Secret string not found")?;

    Ok(secret_string)
}

async fn verify_token<T: TokenVerifier>(token: &str, verifier: &T) -> String {
    match verifier.verify_token(token).await {
        Ok(token) => {
            let user_id = token.critical_claims.sub;
            println!("Token for user {user_id} is valid!");
            user_id
        }
        Err(err) => {
            println!("Token is invalid because {err}!");
            String::new()
        }
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