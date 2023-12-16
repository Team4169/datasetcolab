import json
import os
import shutil
from PIL import Image
from glob import glob
import sys

def find_json_file(path):
    """ Find the first JSON file in the given directory. """
    json_files = glob(os.path.join(path, '*.json'))
    return json_files[0] if json_files else None

def merge_coco_datasets(dataset_paths, output_path):
    merged_data = {
        'images': [],
        'annotations': [],
        'categories': None
    }

    max_image_id = 0
    max_annotation_id = 0
    existing_filenames = set()

    for dataset_path in dataset_paths:
        json_file = find_json_file(dataset_path)
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

            # Check for duplicate filenames and rename if necessary
            original_filename = image['file_name']
            if original_filename in existing_filenames:
                base, extension = os.path.splitext(original_filename)
                new_filename = f"{base}_{new_id}{extension}"
                image['file_name'] = new_filename
            else:
                existing_filenames.add(original_filename)

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
            image_path = os.path.join(dataset_path, original_filename)
            new_image_path = os.path.join(output_path, image_info['file_name'])
            if os.path.exists(image_path) and not os.path.exists(new_image_path):
                shutil.copy(image_path, new_image_path)

    # Save merged JSON
    with open(os.path.join(output_path, 'merged_annotations.json'), 'w') as file:
        json.dump(merged_data, file)

def find_metadata_folders(directory_path, year):
    matching_metadata_folders = []

    for root, dirs, files in os.walk(directory_path):
        if 'metadata.json' in files:
            metadata_file_path = os.path.join(root, 'metadata.json')

            with open(metadata_file_path, 'r') as f:
                metadata = json.load(f)

            # Assuming 'targetDataset' is a key in metadata.json
            target_dataset_value = metadata.get('targetDataset')
            status = metadata.get('status')

            if target_dataset_value == year:
                if status == 'merged':
                    matching_metadata_folders.append(root)
            
    return matching_metadata_folders

year = sys.argv[1]
tempname = sys.argv[2]

directory_path = '/home/team4169/frcdatasetcolab/app/upload'
metadata_folders = find_metadata_folders(directory_path, year)
testFolders = [s + "/test" for s in metadata_folders]
trainFolders = [s + "/train" for s in metadata_folders]
validFolders = [s + "/valid" for s in metadata_folders]

output_path_main = '/home/team4169/frcdatasetcolab/app/' + tempname + "Main"
merge_coco_datasets(testFolders, output_path_main + "/test")
merge_coco_datasets(trainFolders, output_path_main + "/train")
merge_coco_datasets(validFolders, output_path_main + "/valid")