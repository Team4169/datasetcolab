# Getting Started with YOLOv8n

**Install Ultralytics**

```bash
pip install ultralytics
```

**Download the Dataset Colab YOLOv5n.pt model**

Download the <a href="https://datasetcolab.com/models" target="_blank">YOLOv8n.pt</a> directly or via curl.

**Start using the model**

In the same directory, add this to a python file and run it!

```python
from ultralytics import YOLO

# Load a model
model = YOLO('YOLOv8n.pt')  # load an official model

# Predict with the model
results = model(0)  # predict using webcam
```