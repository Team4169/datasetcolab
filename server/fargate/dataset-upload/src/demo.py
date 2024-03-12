import logging
import os

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] {%(filename)s:%(lineno)d} %(levelname)s - %(message)s')

logging.info("dataset/upload started")

container_info = os.popen('cat /proc/self/cgroup').read()
system_name = container_info.split('/')[-1].split('-')[0]
logging.info(system_name)

dynamodb = boto3.client('dynamodb')
response = dynamodb.get_item(
    TableName="upload",
    Key={ id: system_name }
)
logging.info(item)