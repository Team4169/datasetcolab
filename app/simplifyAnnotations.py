import json
import sys
import os
from glob import glob

if len(sys.argv) != 2:
    print("Usage: python simplifyAnnotations.py <path>")
    sys.exit(1)

path = sys.argv[1]
if not os.path.exists(path):
    print("Path does not exist.")
    sys.exit(1)

for json_file in glob(os.path.join(path, '*.json')):
    if not json_file:
        print(f"No JSON file found in {dataset_path}. Skipping this dataset.")
        continue

    with open(json_file) as file:
        data = json.load(file)

    annotations = {}
    for annotation in data['annotations']:
        filename = ""
        for image in merged_data['images']:
            if image['id'] == annotation['image_id']:
                filename = image['file_name']
                break
        if annotation['image_id'] not in annotations:
            annotations[filename] = [annotation]
        else:
            annotations[filename].append(annotation)

    with open(os.path.join(path, "annotations.json"), "w") as outfile:
        json.dump(annotations, outfile)
