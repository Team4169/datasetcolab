use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use lambda_http::{run, service_fn, Request, Response};
use lambda_http::Body as LambdaBody;
use std::error::Error;
use rusoto_secretsmanager::{SecretsManager, SecretsManagerClient, GetSecretValueRequest};
use rusoto_core::Region as RusotoRegion;
use rs_firebase_admin_sdk::{auth::token::TokenVerifier, App, CustomServiceAccount};

async fn function_handler(event: Request) -> Result<Response<LambdaBody>, Box<dyn Error>> {
    let id_token = event.uri().query()
        .and_then(|query| {
            query.split('&')
                .find(|param| param.starts_with("idToken="))
                .map(|param| param.trim_start_matches("idToken="))
        })
        .unwrap_or_else(|| {
            event.headers()
                .get("id_token")
                .and_then(|value| value.to_str().ok())
                .unwrap_or_default()
        });

    if id_token.is_empty() {
        let api = event.uri().query()
            .and_then(|query| {
                query.split('&')
                    .find(|param| param.starts_with("api="))
                    .map(|param| param.trim_start_matches("api="))
            })
            .unwrap_or_else(|| {
                event.headers()
                    .get("api")
                    .and_then(|value| value.to_str().ok())
                    .unwrap_or_default()
            });

        if api.is_empty() {
            return Ok(Response::builder()
                .status(400)
                .body(LambdaBody::from("Missing id_token and api"))
                .map_err(Box::new)?);
        } else {
            return Ok(Response::builder()
                .status(200)
                .body(LambdaBody::from(api))
                .map_err(Box::new)?);
        }
    } else {
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
        if uid == "" {
            return Ok(Response::builder()
                .status(401)
                .body(LambdaBody::from("Unauthorized"))
                .map_err(Box::new)?);
        }

        Ok(Response::builder()
            .status(200)
            .body(LambdaBody::from(uid))
            .map_err(Box::new)?)
    }
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
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
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