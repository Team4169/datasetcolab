import os
import json

metadata_paths = []

for root, dirs, files in os.walk('/home/team4169/datasetcolab/app/upload'):
    for file in files:
        if file == 'metadata.json':
            metadata_path = os.path.join(root, file)
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            if metadata.get('status') != 'merged':
                metadata_paths.append(metadata_path)

for path in metadata_paths:
    print(path)