# Getting Started with YOLOv5n

**Clone the YOLOv5 Reposition**

```bash
git clone https://github.com/ultralytics/yolov5  # clone
cd yolov5
pip install -r requirements.txt  # install
```

**Download the Dataset Colab YOLOv5n.pt model**

<iframe
  src="https://datasetcolab.com/embed?dataset=YOLOv5&model=YOLOv5n"
  style="width: 100%; height: 250px;"
></iframe>

Place this file within the yolov5 folder.

**Start using the model**

```bash
python3 detect.py --weights YOLOv5n.pt --source 0                              # webcam
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