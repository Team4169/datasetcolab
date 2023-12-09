import os
import json
import shutil
from pycocotools.coco import COCO
import sys

def find_json_files(directory_path):
    json_files = [f for f in os.listdir(directory_path) if f.endswith('.json')]
    return json_files

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

def combine_datasets_without_delete(dataset1_path, dataset2_path, output_path):
    # Load COCO annotations
    print(dataset1_path)
    json_file1 = find_json_files(dataset1_path)[0]
    json_file2 = find_json_files(dataset2_path)[0]
    coco1 = COCO(dataset1_path + "/" + json_file1)
    coco2 = COCO(dataset2_path + "/" + json_file2)

    categories1 = coco1.loadCats(coco1.getCatIds())
    categories2 = coco2.loadCats(coco2.getCatIds())

    category_mapping = {'cone': 1, 'cube': 2}  # Map category names to desired category IDs

    for category in categories1:
        category_mapping[category['name']] = category['id']

    for category in categories2:
        category_mapping[category['name']] = category['id']
    
    # Combine image and annotation data
    combined_images = coco1.loadImgs(coco1.getImgIds()) + coco2.loadImgs(coco2.getImgIds())
    combined_annotations = coco1.loadAnns(coco1.getAnnIds()) + coco2.loadAnns(coco2.getAnnIds())

    # Create a new COCO object for the combined dataset
    combined_coco = {
        'images': [],
        'annotations': [],
        'categories': coco1.loadCats(coco1.getCatIds())
    }

    # Create a new directory for the combined dataset
    os.makedirs(output_path, exist_ok=True)

    image_id_mapping = {}
    new_image_id_counter = 0

    for image_info in combined_images:
        # Determine the source dataset for the image based on the file name
        old_image_path = os.path.join(dataset1_path, image_info['file_name'])
        if not os.path.exists(old_image_path):
            old_image_path = os.path.join(dataset2_path, image_info['file_name'])

        new_image_name = generate_unique_name()
        new_image_path = os.path.join(output_path, f'{new_image_name}.jpg')

        image_id_mapping[image_info['id']] = new_image_id_counter
        new_image_id_counter += 1

        shutil.copy(old_image_path, new_image_path)

        # Add new image information to the combined_coco object
        combined_coco['images'].append({
            'id': image_id_mapping[image_info['id']],
            'file_name': f'{new_image_name}.jpg',
            'width': image_info['width'],
            'height': image_info['height'],
            #'date_captured': image_info['date_captured'],
            #'license': image_info['license'],
        })

    annotation_id_mapping = {}
    new_annotation_id_counter = 0

    # Calculate the offset to start new image IDs from 0
    offset_image_id = min(image_id_mapping.values())

    # Update image and annotation file names in the combined COCO annotations
    for annotation in combined_annotations:
        old_image_id = annotation['image_id']
        new_image_id = image_id_mapping[old_image_id] - offset_image_id

        old_category_id = annotation['category_id']
        old_category_name = coco1.loadCats([old_category_id])[0]['name'] if old_category_id in coco1.getCatIds() else coco2.loadCats([old_category_id])[0]['name']
        new_category_id = category_mapping.get(old_category_name, old_category_id)
        annotation['category_id'] = new_category_id

        # Update image_id in the annotation
        annotation['image_id'] = new_image_id

        # Update annotation_id
        annotation_id_mapping[annotation['id']] = new_annotation_id_counter
        new_annotation_id_counter += 1

        # Add new annotation information to the combined_coco object
        combined_coco['annotations'].append(annotation)

    # Save the updated annotations to the JSON file with new image names and annotation IDs
    with open(os.path.join(output_path, 'combined_annotations.json'), 'w') as f:
        json.dump(combined_coco, f)

def combine_datasets_and_merge(dataset1_path, dataset2_path, output_path):
    # Load COCO annotations
    json_file1 = find_json_files(dataset1_path)[0]
    json_file2 = find_json_files(dataset2_path)[0]
    coco1 = COCO(dataset1_path + "/" + json_file1)
    coco2 = COCO(dataset2_path + "/" + json_file2)
    
    # Combine image and annotation data
    combined_images = coco1.loadImgs(coco1.getImgIds()) + coco2.loadImgs(coco2.getImgIds())
    combined_annotations = coco1.loadAnns(coco1.getAnnIds()) + coco2.loadAnns(coco2.getAnnIds())

    # Create a new COCO object for the combined dataset
    combined_coco = {
        'images': [],
        'annotations': [],
        'categories': coco1.loadCats(coco1.getCatIds())
    }

    # Rename and copy images to a new directory
    new_image_dir = os.path.join(output_path)
    os.makedirs(new_image_dir, exist_ok=True)

    image_id_mapping = {}
    new_image_id_counter = 0

    for image_info in combined_images:
        # Determine the source dataset for the image based on the file name
        old_image_path = os.path.join(dataset1_path, image_info['file_name'])
        if not os.path.exists(old_image_path):
            old_image_path = os.path.join(dataset2_path, image_info['file_name'])

        new_image_name = generate_unique_name()
        new_image_path = os.path.join(new_image_dir, f'{new_image_name}.jpg')

        image_id_mapping[image_info['id']] = new_image_id_counter
        new_image_id_counter += 1

        shutil.copy(old_image_path, new_image_path)

        # Add new image information to the combined_coco object
        combined_coco['images'].append({
            'id': image_id_mapping[image_info['id']],
            'file_name': f'{new_image_name}.jpg',
            'width': image_info['width'],
            'height': image_info['height'],
            #'date_captured': image_info['date_captured'],
            #'license': image_info['license'],
            # 'coco_url': image_info['coco_url'],
            # 'flickr_url': image_info['flickr_url']
        })

    annotation_id_mapping = {}
    new_annotation_id_counter = 0

    # Calculate the offset to start new image IDs from 0
    offset_image_id = min(image_id_mapping.values())
    annotation_ids = coco1.getAnnIds() + coco2.getAnnIds()
    num_annotations = len(annotation_ids)
    
    annotationsCounter = 1
    # Update image and annotation file names in the combined COCO annotations
    for annotation in combined_annotations:
        old_image_id = annotation['image_id']
        new_image_id = image_id_mapping[old_image_id] - offset_image_id

        # Update image_id in the annotation
        annotation['image_id'] = new_image_id

        # Update annotation_id
        annotation_id_mapping[annotation['id']] = new_annotation_id_counter
        new_annotation_id_counter += 1

        # Add new annotation information to the combined_coco object
        combined_coco['annotations'].append(annotation)
        
        annotationsCounter += 1

    # Save the updated annotations to the JSON file with new image names and annotation IDs
    with open(os.path.join(output_path, 'combined_annotations.json'), 'w') as f:
        json.dump(combined_coco, f)

    # Replace the first dataset with the new dataset
    shutil.rmtree(dataset1_path)
    shutil.move(output_path, dataset1_path)

def generate_unique_name():
    # Implement your logic to generate a unique name for each image
    # You can use a combination of letters and numbers, e.g., using uuid or random strings.
    # For simplicity, let's use a counter for this example.
    generate_unique_name.counter += 1
    return f'image_{generate_unique_name.counter}'

# Initialize the counter
generate_unique_name.counter = 0

year = sys.argv[1]
tempname = sys.argv[2]

directory_path = '/home/team4169/frcdatasetcolab/app/upload'
metadata_folders = find_metadata_folders(directory_path, year)

output_path_main = '/home/team4169/frcdatasetcolab/app/' + tempname + "Main"
combine_datasets_without_delete(metadata_folders[0] + "/test", metadata_folders[1] + "/test", output_path_main + "/test")
combine_datasets_without_delete(metadata_folders[0] + "/train", metadata_folders[1] + "/train", output_path_main + "/train")
combine_datasets_without_delete(metadata_folders[0] + "/valid", metadata_folders[1] + "/valid", output_path_main + "/valid")
output_path = '/home/team4169/frcdatasetcolab/app/' + tempname
for i in range(2, len(metadata_folders)):
    combine_datasets_and_merge(output_path_main + "/test", metadata_folders[i] + "/test", output_path)
    combine_datasets_and_merge(output_path_main + "/train", metadata_folders[i] + "/train", output_path)
    combine_datasets_and_merge(output_path_main + "/valid", metadata_folders[i] + "/valid", output_path)