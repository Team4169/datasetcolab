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

annotations = {}
for subproject in ["train", "test", "valid"]:
    for json_file in glob(os.path.join(path, subproject, '*.json')):
        if not json_file:
            print(f"No JSON file found in {dataset_path}. Skipping this dataset.")
            continue

        with open(json_file) as file:
            data = json.load(file)

        categories = {}
        for category in data["categories"]:
            if category["name"] != "REMOVE":
                categories[category["id"]] = category["name"]

        subannotations = {}
        for annotation in data['annotations']:
            filename = ""
            for image in data['images']:
                if image['id'] == annotation['image_id']:
                    filename = image['file_name']
                    break
            if annotation["category_id"] in categories:
                simplifiedannotation = { "bbox": annotation["bbox"], "category": categories[annotation["category_id"]], "category_id": annotation["category_id"]  }
                if filename not in subannotations:
                    subannotations[filename] = [simplifiedannotation]
                else:
                    subannotations[filename].append(simplifiedannotation)
        annotations[subproject] = subannotations

with open(os.path.join(path, "annotations.json"), "w") as outfile:
    json.dump(annotations, outfile)
