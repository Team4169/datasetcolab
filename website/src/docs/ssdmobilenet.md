# Getting Started with SSD Mobilenet v2

**Clone the Tensorflow inference repository**

```bash
git clone https://github.com/team4169/datasetcolabmodels
cd datasetcolabmodels/tflite
pip install -r requirements.txt
```

**Download the Dataset Colab SSD Mobilenet v2 model**

<iframe
  src="https://datasetcolab.com/embed?dataset=ssdmobilenet&model=ssdmobilenet"
  style="width: 100%; height: 250px;"
></iframe>

**Start using the model**

```bash
unzip MODEL_NAME.zip
python3 main.py --weights MODEL_NAME/ssdmobilenet.tflite --labelmap MODEL_NAME/labelmap.pbtxt
```