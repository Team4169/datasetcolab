import os, subprocess

start_directory = "/home/team4169/datasetcolab/app/upload/"
for entry in os.listdir(start_directory):
    full_path = os.path.join(start_directory, entry)
    if os.path.isdir(full_path):
        for subentry in os.listdir(full_path):
            sub_full_path = os.path.join(start_directory, entry, subentry)
            if os.path.isdir(sub_full_path):
                os.system("python3 simplifyAnnotations.py " + sub_full_path)
                print(sub_full_path)
