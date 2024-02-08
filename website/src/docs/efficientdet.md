# Getting Started with EfficientDet

**Clone the Tensorflow inference repository**

```bash
git clone https://github.com/team4169/datasetcolabmodels
cd datasetcolabmodels/tflite
pip install -r requirements.txt
```

**Download the Dataset Colab EfficientDet model**

<iframe
  src="https://datasetcolab.com/embed?dataset=efficientdet&model=efficientdet"
  style="width: 100%; height: 250px;"
></iframe>

**Start using the model**

```bash
unzip MODEL_NAME.zip
python3 main.py --weights MODEL_NAME/efficientdet.tflite --labelmap MODEL_NAME/labelmap.pbtxt
```