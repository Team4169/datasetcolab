# Getting Start with YOLOv5n

**Clone the YOLOv5 Reposition**

```bash
git clone https://github.com/ultralytics/yolov5  # clone
cd yolov5
pip install -r requirements.txt  # install
```

**Download the Dataset Colab YOLOv5n.pt model**

Download the <a href="https://datasetcolab.com/models" target="_blank">YOLOv5n.pt</a> directly or via curl. Place this file within the yolov5 folder.

**Start using the model**

```bash
python3 detect.py --weights YOLOv5n.pt --source 0                               # webcam
                                               img.jpg                         # image
                                               vid.mp4                         # video
                                               screen                          # screenshot
                                               path/                           # directory
                                               list.txt                        # list of images
                                               list.streams                    # list of streams
                                               'path/*.jpg'                    # glob
                                               'https://youtu.be/LNwODJXcvt4'  # YouTube
                                               'rtsp://example.com/media.mp4'  # RTSP, RTMP, HTTP stream
```