import os

folder_path = "/home/team4169/datasetcolab/app/models/ssdmobilenetRO/images"  # Replace with the actual folder path

# Get a list of all files in the folder
files = os.listdir(folder_path)

# Iterate over the files
for i, file_name in enumerate(files):
    if file_name.endswith(".jpg"):
        # Generate the new file name
        new_file_name = f"processed_{i}.jpg"

        # Construct the full paths for the old and new file names
        old_file_path = os.path.join(folder_path, file_name)
        new_file_path = os.path.join(folder_path, new_file_name)

        # Rename the file
        os.rename(old_file_path, new_file_path)