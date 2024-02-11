# Getting Started with YOLOv6n

**Install Ultralytics**

```bash
pip install ultralytics
```

**Download the Dataset Colab YOLOv6n.pt model**

<iframe
  src="https://datasetcolab.com/embed?dataset=YOLOv6&model=YOLOv6n"
  style="width: 100%; height: 250px;"
></iframe>

**Start using the model**

In the same directory, add this to a python file and run it!

```python
from ultralytics import YOLO

# Load a model
model = YOLO('YOLOv6n.pt')  # load an official model

# Predict with the model
results = model(0)  # predict using webcam
```