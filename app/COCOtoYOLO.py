import json
import numpy as np
import yaml
from pathlib import Path
from collections import defaultdict
from tqdm import tqdm
import os
import shutil
import sys

def convert_coco_json(json_dir, dataset_dir, images_dir, use_segments=False, cls91to80=False):
    def make_dirs():
        images_dir_path = Path(dataset_dir) / 'images'
        labels_dir_path = Path(dataset_dir) / 'labels'
        images_dir_path.mkdir(parents=True, exist_ok=True)
        labels_dir_path.mkdir(parents=True, exist_ok=True)
        return images_dir_path, labels_dir_path

    def coco91_to_coco80_class():
        x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, None, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, None, 24, 25, None,
             None, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, None, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
             51, 52, 53, 54, 55, 56, 57, 58, 59, None, 60, None, None, 61, None, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
             None, 73, 74, 75, 76, 77, 78, 79, None]
        return x

    def min_index(arr1, arr2):
        dis = ((arr1[:, None, :] - arr2[None, :, :]) ** 2).sum(-1)
        return np.unravel_index(np.argmin(dis, axis=None), dis.shape)

    def merge_multi_segment(segments):
        s = []
        segments = [np.array(i).reshape(-1, 2) for i in segments]
        idx_list = [[] for _ in range(len(segments))]

        for i in range(1, len(segments)):
            idx1, idx2 = min_index(segments[i - 1], segments[i])
            idx_list[i - 1].append(idx1)
            idx_list[i].append(idx2)

        for k in range(2):
            if k == 0:
                for i, idx in enumerate(idx_list):
                    if len(idx) == 2 and idx[0] > idx[1]:
                        idx = idx[::-1]
                        segments[i] = segments[i][::-1, :]

                    segments[i] = np.roll(segments[i], -idx[0], axis=0)
                    segments[i] = np.concatenate([segments[i], segments[i][:1]])
                    if i in [0, len(idx_list) - 1]:
                        s.append(segments[i])
                    else:
                        idx = [0, idx[1] - idx[0]]
                        s.append(segments[i][idx[0]:idx[1] + 1])

            else:
                for i in range(len(idx_list) - 1, -1, -1):
                    if i not in [0, len(idx_list) - 1]:
                        idx = idx_list[i]
                        nidx = abs(idx[1] - idx[0])
                        s.append(segments[i][nidx:])
        return s

    images_dir_path, labels_dir_path = make_dirs()
    coco80 = coco91_to_coco80_class()

    for json_file in sorted(Path(json_dir).resolve().glob('*.json')):
        with open(json_file) as f:
            data = json.load(f)

        images = {'%g' % x['id']: x for x in data['images']}
        imgToAnns = defaultdict(list)
        for ann in data['annotations']:
            imgToAnns[ann['image_id']].append(ann)

        for img_id, anns in tqdm(imgToAnns.items(), desc=f'Annotations {json_file}'):
            img = images['%g' % img_id]
            h, w, f = img['height'], img['width'], img['file_name']

            img_path = Path(images_dir) / f
            if img_path.exists():
                shutil.move(str(img_path), str(images_dir_path / f))
            else:
                print(f"Image file not found: {img_path}")

            bboxes = []
            segments = []

            for ann in anns:
                if ann['iscrowd']:
                    continue
                # The COCO box format is [top left x, top left y, width, height]
                box = np.array(ann['bbox'], dtype=np.float64)
                box[:2] += box[2:] / 2  # xy top-left corner to center
                box[[0, 2]] /= w  # normalize x
                box[[1, 3]] /= h  # normalize y
                if box[2] <= 0 or box[3] <= 0:  # if w <= 0 and h <= 0
                    continue

                cls = coco80[ann['category_id'] - 1] if cls91to80 else ann['category_id'] - 1  # class
                box = [cls] + box.tolist()
                if box not in bboxes:
                    bboxes.append(box)
                # Segments
                if use_segments:
                    if len(ann['segmentation']) > 1:
                        s = merge_multi_segment(ann['segmentation'])
                        s = (np.concatenate(s, axis=0) / np.array([w, h])).reshape(-1).tolist()
                    else:
                        s = [j for i in ann['segmentation'] for j in i]  # all segments concatenated
                        s = (np.array(s).reshape(-1, 2) / np.array([w, h])).reshape(-1).tolist()
                    s = [cls] + s
                    if s not in segments:
                        segments.append(s)

            with open(labels_dir_path / f'{Path(f).stem}.txt', 'a') as file:
                for i in range(len(bboxes)):
                    line = *(segments[i] if use_segments else bboxes[i]),  # cls, box or segments
                    file.write(('%g ' * len(line)).rstrip() % line + '\n')

def create_data_yaml(dataset_dir, num_classes, class_names):
    data = {
        'train': 'train',  # Path relative to 'path' in data.yaml
        'val': 'valid',    # Path relative to 'path' in data.yaml
        'test': 'test',    # Path relative to 'path' in data.yaml (optional)
        'names': {i: name for i, name in enumerate(class_names)}
    }

    with open(Path(dataset_dir) / 'data.yaml', 'w') as file:
        yaml.dump(data, file, default_flow_style=False)

overall_dir = sys.argv[1]
dataset = sys.argv[2]
class_names = sys.argv[3:]
print(class_names)

valid_dir = os.path.join(overall_dir, 'valid')
train_dir = os.path.join(overall_dir, 'train')
test_dir = os.path.join(overall_dir, 'test')

convert_coco_json(valid_dir, valid_dir, valid_dir)
convert_coco_json(train_dir, train_dir, train_dir)
convert_coco_json(test_dir, test_dir, test_dir)

# Create data.yaml
create_data_yaml(overall_dir, len(class_names), class_names)

# Delete JSON file
for json_file in Path(valid_dir).glob('*.json'):
    json_file.unlink()
for json_file in Path(train_dir).glob('*.json'):
    json_file.unlink()
for json_file in Path(test_dir).glob('*.json'):
    json_file.unlink()
