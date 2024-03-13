import logging
import os
import boto3
import requests
import zipfile

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] {%(filename)s:%(lineno)d} %(levelname)s - %(message)s')
logging.info("dataset/upload started")

container_info = os.popen('cat /proc/self/cgroup').read()
system_name = container_info.split('/')[-1].split('-')[0]

dynamodb = boto3.client('dynamodb')
response = dynamodb.get_item(
    TableName="upload",
    Key={'id': {'S': system_name}}
)
roboflow_export_link = response['Item']['roboflow_export_link']['S']
file_key = response['Item']['file_key']['S']
response = dynamodb.delete_item(
    TableName="upload",
    Key={'id': {'S': system_name}}
)

response = requests.get(roboflow_export_link)
zip_file_path = '/tmp/roboflow_export.zip'
with open(zip_file_path, 'wb') as zip_file:
    zip_file.write(response.content)

unzip_folder_path = '/tmp/roboflow_export'
with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
    zip_ref.extractall(unzip_folder_path)

s3 = boto3.client('s3')
bucket_name = 'datasetcolab2'
for root, dirs, files in os.walk(unzip_folder_path):
    for file in files:
        file_path = os.path.join(root, file)
        s3_key = os.path.relpath(file_path, unzip_folder_path)
        with open(file_path, 'rb') as data:
            s3.upload_fileobj(data, bucket_name, os.path.join(file_key, s3_key))

logging.info("Folder uploaded to S3")
