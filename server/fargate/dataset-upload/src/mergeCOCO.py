import json, sys, os, shutil, random, string, datetime, zipfile, subprocess, itertools, time, math, concurrent.futures
from PIL import Image
from glob import glob

def find_json_file(path):
    json_files = glob(os.path.join(path, '*.json'))
    return json_files[0] if json_files else None

def copy_image(image_info, dataset_path, output_path):
    image_path = os.path.join(dataset_path, image_info['file_name'])
    if os.path.exists(image_path):
        shutil.copy(image_path, os.path.join(output_path, image_info['file_name']))

def merge_coco(dataset_paths, output_path, classes):
    merged_data = {
        'images': [],
        'annotations': [],
        'categories': [{"name": "objects", "supercategory": "none", "id": 0}]
    }

    max_image_id = 0
    max_annotation_id = 0

    updated_dataset_paths = []

    for dataset_path in dataset_paths:
        json_file = find_json_file(dataset_path)
        if not json_file:
            print(f"No JSON file found in {dataset_path}. Skipping this dataset.")
            continue
        else:
            updated_dataset_paths.append(dataset_path)

        # Load JSON data
        with open(json_file) as file:
            data = json.load(file)

        # Set categories from the first dataset (assuming all datasets have the same categories)
        for category in data['categories']:
            if category["name"] not in [cat["name"] for cat in merged_data['categories']] and category["supercategory"] != "none" and category["name"] in classes:
                merged_data['categories'].append({ "name": category["name"], "supercategory": "objects", "id": len(merged_data['categories']) })

    images = {}

    for dataset_path in updated_dataset_paths:
        json_file = find_json_file(dataset_path)
        if not json_file:
            print(f"No JSON file found in {dataset_path}. Skipping this dataset.")
            continue

        with open(json_file) as file:
            data = json.load(file)

        # Update IDs in the dataset
        id_mapping = {}
        for image in data['images']:
            old_id = image['id']
            new_id = old_id + max_image_id
            id_mapping[old_id] = new_id
            image['id'] = new_id
            merged_data['images'].append(image)
            images[os.path.basename(image['file_name'])] = dataset_path + '/' + image['file_name']

        for annotation in data['annotations']:
            approved = False
            category_name = None
            for category in data['categories']:
                if category['id'] == annotation['category_id']:
                    category_name = category['name']
                    break

            for category in merged_data['categories']:
                if category['name'] == category_name:
                    annotation['category_id'] = category['id']
                    approved = True
                    break

            annotation['id'] += max_annotation_id
            annotation['image_id'] = id_mapping[annotation['image_id']]
            if approved:
                merged_data['annotations'].append(annotation)

        # Remove images without annotations
        merged_data['images'] = [image for image in merged_data['images'] if any(annotation['image_id'] == image['id'] for annotation in merged_data['annotations'])]

        # Update max ID values for the next dataset
        max_image_id = max([img['id'] for img in merged_data['images']], default=max_image_id)
        max_annotation_id = max([ann['id'] for ann in merged_data['annotations']], default=max_annotation_id)

        # Save merged JSON
        os.makedirs(output_path, exist_ok=True)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = []
            for image_info in merged_data['images']:
                future = executor.submit(copy_image, image_info, dataset_path, output_path)
                futures.append(future)

            # Wait for all tasks to complete
            concurrent.futures.wait(futures)

    with open(os.path.join(output_path, '_annotations.coco.json'), 'w') as file:
        json.dump(merged_data, file)

    return images

def find_metadata_folders(directory_path, year, class_combo):
    matching_metadata_folders = []

    for root, dirs, files in os.walk(directory_path):
        if 'metadata.json' in files:
            metadata_file_path = os.path.join(root, 'metadata.json')
            with open(metadata_file_path, 'r') as f:
                metadata = json.load(f)

            # Assuming 'targetDataset' is a key in metadata.json
            target_dataset_value = metadata.get('targetDataset')
            classes = metadata.get('classes')
            status = metadata.get('status')

            if target_dataset_value == year and status == 'merged' and set(class_combo).issubset(set(classes)):
                matching_metadata_folders.append(root)
            
    return matching_metadata_folders

def new_zip_dataset(images, path):
    with zipfile.ZipFile(path + ".zip", 'w') as zipf:
        for test_image in images["test"].values():
            zipf.write(test_image, "test/" + os.path.basename(test_image))
        for train_image in images["train"].values():
            zipf.write(train_image, "train/" + os.path.basename(train_image))
        for valid_image in images["valid"].values():
            zipf.write(valid_image, "valid/" + os.path.basename(valid_image))

        zipf.write(os.path.join(path, "test/_annotations.coco.json"), "test/_annotations.coco.json")
        zipf.write(os.path.join(path, "train/_annotations.coco.json"), "train/_annotations.coco.json")
        zipf.write(os.path.join(path, "valid/_annotations.coco.json"), "valid/_annotations.coco.json")

    zipf.close()

def zip_dataset(dataset_path, output_path):
    with zipfile.ZipFile(output_path, 'w') as zipf:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            for root, dirs, files in os.walk(dataset_path):
                for file in files:
                    zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), dataset_path))

def count_annotations(folder_path):
    annotation_count = 0
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith('.json'):
                with open(os.path.join(root, file), 'r') as f:
                    data = json.load(f)
                    annotation_count += len(data['annotations'])
    return annotation_count
