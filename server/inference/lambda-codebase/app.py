from yolo_onnx.yolov8_onnx import YOLOv8
import json
import base64
from io import BytesIO
from PIL import Image

# Initialize YOLOv8 object detector
yolov8_detector = YOLOv8('./models/best2.onnx')

def main(event, context):

    # get payload
    body = json.loads(event['body'])

    # get params
    img_b64 = body['image']
    size = body.get('size', 640)
    conf_thres = body.get('conf_thres', 0.3)
    iou_thres = body.get('iou_thres', 0.5)

    # open image
    img = Image.open(BytesIO(base64.b64decode(img_b64.encode('ascii'))))

    # infer result
    detections = yolov8_detector(img, size=size, conf_thres=conf_thres, iou_thres=iou_thres)

    # return result
    return {
        "statusCode": 200,
        "body": json.dumps({
            "detections": detections
        }),
    }
