import json, sys, os, shutil, random, string
from PIL import Image
from glob import glob
import datetime

def findJsonFile(path):
    """ Find the first JSON file in the given directory. """
    jsonFiles = glob(os.path.join(path, '*.json'))
    return jsonFiles[0] if jsonFiles else None

def mergeCocoDatasets(dataset_paths, output_path):
    merged_data = {
        'images': [],
        'annotations': [],
        'categories': None
    }

    max_image_id = 0
    max_annotation_id = 0

    for dataset_path in dataset_paths:
        json_file = findJsonFile(dataset_path)
        if not json_file:
            print(f"No JSON file found in {dataset_path}. Skipping this dataset.")
            continue

        # Load JSON data
        with open(json_file) as file:
            data = json.load(file)

        # Set categories from the first dataset (assuming all datasets have the same categories)
        if merged_data['categories'] is None:
            merged_data['categories'] = data['categories']

        # Update IDs in the dataset
        id_mapping = {}
        for image in data['images']:
            old_id = image['id']
            new_id = old_id + max_image_id
            id_mapping[old_id] = new_id
            image['id'] = new_id
            merged_data['images'].append(image)

        for annotation in data['annotations']:
            annotation['id'] += max_annotation_id
            annotation['image_id'] = id_mapping[annotation['image_id']]
            merged_data['annotations'].append(annotation)

        # Update max ID values for the next dataset
        max_image_id = max([img['id'] for img in merged_data['images']], default=max_image_id)
        max_annotation_id = max([ann['id'] for ann in merged_data['annotations']], default=max_annotation_id)

        # Copy images to output folder
        os.makedirs(output_path, exist_ok=True)
        for image_info in data['images']:
            image_path = os.path.join(dataset_path, image_info['file_name'])
            if os.path.exists(image_path):
                shutil.copy(image_path, os.path.join(output_path, image_info['file_name']))

    # Save merged JSON
    with open(os.path.join(output_path, '_annotations.coco.json'), 'w') as file:
        json.dump(merged_data, file)

def findMetadataFolders(directoryPath, year):
    matchingMetadataFolders = []

    for root, dirs, files in os.walk(directoryPath):
        if 'metadata.json' in files:
            metadataFilePath = os.path.join(root, 'metadata.json')
            #print(metadataFilePath)
            with open(metadataFilePath, 'r') as f:
                metadata = json.load(f)

            # Assuming 'targetDataset' is a key in metadata.json
            targetDatasetValue = metadata.get('targetDataset')
            status = metadata.get('status')

            if targetDatasetValue == year:
                if status == 'merged':
                    matchingMetadataFolders.append(root)
            
    return matchingMetadataFolders

year = "FRC2023"
tempName = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))

directoryPath = '/home/team4169/datasetcolab/app/upload'
metadataFolders = findMetadataFolders(directoryPath, year)
testFolders = [s + "/test" for s in metadataFolders]
trainFolders = [s + "/train" for s in metadataFolders]
validFolders = [s + "/valid" for s in metadataFolders]

outputPathMain = '/home/team4169/datasetcolab/app/download/' + tempName
mergeCocoDatasets(testFolders, outputPathMain + "/test")
mergeCocoDatasets(trainFolders, outputPathMain + "/train")
mergeCocoDatasets(validFolders, outputPathMain + "/valid")
metadata = {
    "folderName": tempName,
    "uploadName": "FRC 2023",
    "datasetType": "COCO"
}

metadataFilePath = '/home/team4169/datasetcolab/app/download/' + tempName + '/metadata.json'
with open(metadataFilePath, 'w') as f:
    json.dump(metadata, f)

currentDatasetPath = '/home/team4169/datasetcolab/app/important.json'
with open(currentDatasetPath, 'r') as f:
    currentDataset = json.load(f)
try:
    shutil.rmtree('/home/team4169/datasetcolab/app/download/' + currentDataset[year])
except:
    pass
currentDataset[year] = tempName
with open(currentDatasetPath, 'w') as f:
    json.dump(currentDataset, f)
