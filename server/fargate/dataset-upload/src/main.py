import logging, os, boto3, requests, zipfile, random, string
from PIL import Image, UnidentifiedImageError

# Initalize logging, get container info
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

# Download from ROBOFLOW
response = requests.get(roboflow_export_link)
zip_file_path = '/tmp/roboflow_export.zip'
with open(zip_file_path, 'wb') as zip_file:
    zip_file.write(response.content)

unzip_folder_path = '/tmp/roboflow_export'
with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
    zip_ref.extractall(unzip_folder_path)

# Download full folder for combine
local_folder_path = '/path/to/local/folder'
os.makedirs(local_folder_path, exist_ok=True)

s3 = boto3.client('s3')
bucket_name = 'datasetcolab2'
response = s3.list_objects_v2(Bucket=bucket_name, Prefix=file_key)

for obj in response['Contents']:
    s3_key = obj['Key']
    local_file_path = os.path.join(local_folder_path, os.path.basename(s3_key))
    s3.download_file(bucket_name, s3_key, local_file_path)

logging.info("Folder downloaded locally")

# Upload new dataset
s3 = boto3.client('s3')
bucket_name = 'datasetcolab2'
for root, dirs, files in os.walk(unzip_folder_path):
    for file in files:
        file_path = os.path.join(root, file)
        s3_key = os.path.relpath(file_path, unzip_folder_path)
        with open(file_path, 'rb') as data:
            if file_path.endswith(('.jpg', '.jpeg', '.png', '.gif')):
                random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
                s3_key = '.'.join(s3_key.split('.')[:-1]) + "." + random_string + "." + s3_key.split('.')[-1]
                try:
                    image = Image.open(data)
                    if image.format != 'WEBP':
                        webp_file_path = file_path + '.webp'
                        image.save(webp_file_path, 'WEBP')
                        s3.upload_file(webp_file_path, bucket_name, os.path.join(file_key, '.'.join(s3_key.split('.')[:-1]) + '.webp'))
                    s3.upload_file(file_path, bucket_name, os.path.join(file_key, s3_key))
                except UnidentifiedImageError:
                    logging.warning(f"Skipping file: {file_path} (not a valid image)")
            else:
                s3.upload_file(file_path, bucket_name, os.path.join(file_key, s3_key))

# Combine

# Upload combined folder

logging.info("Folder uploaded to S3")
