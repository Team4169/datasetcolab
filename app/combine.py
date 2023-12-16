import json, sys, os, shutil, random, string
from PIL import Image
from glob import glob
import datetime

def findJsonFile(path):
    """ Find the first JSON file in the given directory. """
    jsonFiles = glob(os.path.join(path, '*.json'))
    return jsonFiles[0] if jsonFiles else None

def mergeCocoDatasets(datasetPaths, outputPath):
    mergedData = {
        'images': [],
        'annotations': [],
        'categories': None
    }

    maxImageId = 0
    maxAnnotationId = 0
    existingFilenames = set()

    for datasetPath in datasetPaths:
        jsonFile = findJsonFile(datasetPath)
        if not jsonFile:
            print(f"No JSON file found in {datasetPath}. Skipping this dataset.")
            continue

        # Load JSON data
        with open(jsonFile) as file:
            data = json.load(file)

        # Set categories from the first dataset (assuming all datasets have the same categories)
        if mergedData['categories'] is None:
            mergedData['categories'] = data['categories']

        # Update IDs in the dataset
        idMapping = {}
        for image in data['images']:
            oldId = image['id']
            newId = oldId + maxImageId
            idMapping[oldId] = newId
            image['id'] = newId

            # Check for duplicate filenames and rename if necessary
            originalFilename = image['file_name']
            if originalFilename in existingFilenames:
                base, extension = os.path.splitext(originalFilename)
                newFilename = f"{base}_{newId}{extension}"
                image['file_name'] = newFilename
            else:
                existingFilenames.add(originalFilename)

            mergedData['images'].append(image)

        for annotation in data['annotations']:
            annotation['id'] += maxAnnotationId
            annotation['image_id'] = idMapping[annotation['image_id']]
            mergedData['annotations'].append(annotation)

        # Update max ID values for the next dataset
        maxImageId = max([img['id'] for img in mergedData['images']], default=maxImageId)
        maxAnnotationId = max([ann['id'] for ann in mergedData['annotations']], default=maxAnnotationId)

        # Copy images to output folder
        os.makedirs(outputPath, exist_ok=True)
        for imageInfo in data['images']:
            imagePath = os.path.join(datasetPath, originalFilename)
            newImagePath = os.path.join(outputPath, imageInfo['file_name'])
            if os.path.exists(imagePath) and not os.path.exists(newImagePath):
                shutil.copy(imagePath, newImagePath)

    # Save merged JSON
    with open(os.path.join(outputPath, '_annotations.coco.json'), 'w') as file:
        json.dump(mergedData, file)

def findMetadataFolders(directoryPath, year):
    matchingMetadataFolders = []

    for root, dirs, files in os.walk(directoryPath):
        if 'metadata.json' in files:
            metadataFilePath = os.path.join(root, 'metadata.json')

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

directoryPath = '/home/team4169/frcdatasetcolab/app/upload'
metadataFolders = findMetadataFolders(directoryPath, year)
testFolders = [s + "/test" for s in metadataFolders]
trainFolders = [s + "/train" for s in metadataFolders]
validFolders = [s + "/valid" for s in metadataFolders]

outputPathMain = '/home/team4169/frcdatasetcolab/app/upload/' + tempName
mergeCocoDatasets(testFolders, outputPathMain + "/test")
mergeCocoDatasets(trainFolders, outputPathMain + "/train")
mergeCocoDatasets(validFolders, outputPathMain + "/valid")

metadata = {
    "folderName": tempName,
    "uploadName": "FRC 2023",
    "datasetType": "COCO"
}

metadataFilePath = '/home/team4169/frcdatasetcolab/app/upload/' + tempName + '/metadata.json'
with open(metadataFilePath, 'w') as f:
    json.dump(metadata, f)

currentDatasetPath = '/home/team4169/frcdatasetcolab/app/currentDataset.json'
with open(currentDatasetPath, 'r') as f:
    currentDataset = json.load(f)
shutil.rmtree('/home/team4169/frcdatasetcolab/app/upload/' + currentDataset[year])
currentDataset[year] = tempName
with open(currentDatasetPath, 'w') as f:
    json.dump(currentDataset, f)
