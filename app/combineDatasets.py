import os
import json
import shutil
from pycocotools.coco import COCO
import sys

def combine_datasets(dataset1_path, dataset2_path, output_path):
    # Load COCO annotations
    coco1 = COCO(os.path.join(dataset1_path, 'combined_annotations.json'))
    coco2 = COCO(os.path.join(dataset2_path, '_annotations.coco.json'))

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
            'date_captured': image_info['date_captured'],
            'license': image_info['license'],
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

# Example usage



dataset1_path = "/home/team4169/frcdatasetcolab/app/upload/" + sys.argv[1]
dataset2_path = "/home/team4169/frcdatasetcolab/app/upload/" + sys.argv[2]
output_path = '/home/team4169/frcdatasetcolab/app/output'
combine_datasets(dataset1_path, dataset2_path, output_path)
