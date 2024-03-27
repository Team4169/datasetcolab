import logging, os, boto3, requests, zipfile, random, string, json
from PIL import Image, UnidentifiedImageError
from pytube import YouTube
from moviepy.editor import VideoFileClip

# Initalize logging, get container info
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] {%(filename)s:%(lineno)d} %(levelname)s - %(message)s')
logging.info("dataset/upload started")

container_info = os.popen('cat /proc/self/cgroup').read()
system_name = container_info.split('/')[-1].split('-')[0]

dynamodb = boto3.client('dynamodb')
response = dynamodb.scan(
    TableName="upload",
    FilterExpression="task_id = :task_id",
    ExpressionAttributeValues={":task_id": {"S": system_name}}
)
'''
dynamodb.delete_item(
    TableName="upload",
    Key={'task_id': {'S': system_name}}
)
'''
id = response['Items'][0]['id']['S']
upload_type = response['Items'][0]['upload_type']['S']
user_name = response['Items'][0]['user_name']['S']
repository_name = response['Items'][0]['repository_name']['S']
file_key = os.path.join(user_name, repository_name, 'datasets', system_name)

if (upload_type == 'roboflow'):
    # Download from Roboflow
    roboflow_export_link = response['Items'][0]['roboflow_export_link']['S']
    response = requests.get(roboflow_export_link)
    zip_file_path = '/tmp/roboflow_export.zip'
    with open(zip_file_path, 'wb') as zip_file:
        zip_file.write(response.content)
    unzip_folder_path = '/tmp/roboflow_export'
    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(unzip_folder_path)

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
                        ''' # Add back later
                        if image.format != 'WEBP':
                            webp_file_path = file_path + '.webp'
                            image.save(webp_file_path, 'WEBP')
                            s3.upload_file(webp_file_path, bucket_name, os.path.join(file_key, '.'.join(s3_key.split('.')[:-1]) + '.webp'))
                        '''
                        s3.upload_file(file_path, bucket_name, os.path.join(file_key, s3_key))
                    except UnidentifiedImageError:
                        logging.warning(f"Skipping file: {file_path} (not a valid image)")
                else:
                    s3.upload_file(file_path, bucket_name, os.path.join(file_key, s3_key))

elif upload_type == "youtube":
    # Download from YouTube
    youtube_url = response['Items'][0]['youtube_url']['S']
    video = YouTube(youtube_url).streams.first().download()

    # Extract frames
    clip = VideoFileClip(video)
    frames = [frame for frame in clip.iter_frames()]
    frames = frames[::int(len(frames)/300)]
    os.makedirs('/tmp/frames', exist_ok=True)
    for i, frame in enumerate(frames):
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        frame_path = os.path.join('/tmp/frames', f"{random_string}.frame.jpg")
        Image.fromarray(frame).save(frame_path)
    
    # Empty annotation files
    annotations = {
        "train":{
            "images": [],
            "annotations": [],
            "categories": []
        },
        "test":{
            "images": [],
            "annotations": [],
            "categories": []
        },
        "valid": {
            "images": [],
            "annotations": [],
            "categories": []
        }
    }

    # Upload new dataset
    s3 = boto3.client('s3')
    bucket_name = 'datasetcolab2'
    for root, dirs, files in os.walk('/tmp/frames'):
        for file in files:
            file_path = os.path.join(root, file)
            s3_key = os.path.relpath(file_path, '/tmp/frames')
            subfolder = random.choices(["train", "test", "valid"], weights=[0.7, 0.2, 0.1], k=1)[0]
            with open(file_path, 'rb') as data:
                image = Image.open(data)
                width, height = image.size
                annotations[subfolder]["images"].append({
                    "file_name": s3_key,
                    "height": height,
                    "width": width,
                    "id": len(annotations[subfolder]["images"])
                })
                s3.upload_file(file_path, bucket_name, os.path.join(file_key, subfolder, s3_key))

    # Save annotation files
    for subfolder in annotations:
        with open(os.path.join('/tmp/frames', f"{subfolder}.json"), 'w') as annotation_file:
            json.dump(annotations[subfolder], annotation_file)
        s3.upload_file(os.path.join('/tmp/frames', f"{subfolder}.json"), bucket_name, os.path.join(file_key, f".annotations.coco.json"))

elif upload_type == "direct":
    s3 = boto3.client('s3')
    bucket_name = 'datasetcolab2'
    upload_file_key = os.path.join(user_name, repository_name, 'uploads', id)
    response = s3.list_objects_v2(Bucket=bucket_name, Prefix=upload_file_key)

    # Empty annotation files
    annotations = {
        "train":{
            "images": [],
            "annotations": [],
            "categories": []
        },
        "test":{
            "images": [],
            "annotations": [],
            "categories": []
        },
        "valid": {
            "images": [],
            "annotations": [],
            "categories": []
        }
    }

    for obj in response['Contents']:
        s3_key = obj['Key']
        logging.info(f"Processing file: {s3_key}")
        subfolder = random.choices(["train", "test", "valid"], weights=[0.7, 0.2, 0.1], k=1)[0]
        annotations[subfolder]["images"].append({
            "file_name": os.path.basename(s3_key),
            "id": len(annotations[subfolder]["images"])
        })
        new_s3_key = os.path.join(user_name, repository_name, 'datasets', id, subfolder, os.path.basename(s3_key))
        s3.copy_object(Bucket=bucket_name, CopySource=f"{upload_file_key}/{s3_key}", Key=new_s3_key)
        s3.delete_object(Bucket=bucket_name, Key=s3_key)
        
    # Save annotation files
    for subfolder in annotations:
        with open(os.path.join('/tmp/frames', f"{subfolder}.json"), 'w') as annotation_file:
            json.dump(annotations[subfolder], annotation_file)
        s3.upload_file(os.path.join('/tmp/frames', f"{subfolder}.json"), bucket_name, os.path.join(file_key, f".annotations.coco.json"))
 
else:
    logging.error("Unknown upload type")
    quit()

logging.info("complete")