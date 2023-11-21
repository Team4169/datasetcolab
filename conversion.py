import roboflow, random, string, time, os, glob

with open("roboflow.txt", "r") as file:
    api_key = file.read().strip()

print(api_key)
rf = roboflow.Roboflow(api_key=api_key)

def findImages(folder):
    image_files = []
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                image_files.append(os.path.join(root, file))
    return image_files

# Example usage:
def convert(folder, downloadFolder, currentAnnotationType, currentType, newType):
    project = rf.workspace().create_project(
        project_name="gaema",
        project_type=currentAnnotationType,
        project_license="MIT",
        annotation="frc2023",
    )
    
    for file in findImages(folder):
        print(file)
        if "train" in file:
            split = "train"
        elif "test" in file:
            split = "test"
        elif "valid" in file:
            split = "valid" 
        else:
            split = "train"
        project.upload(
            image_path=file,
            split="train",
            num_retry_uploads=3
        )
    
    '''
    project.generate_version({"augmentation" : {}, "preprocessing" : {}})
    version = project.version("1")

    time.sleep(500)

    version.download(model_format=newType, location=downloadFolder)
    '''

convert("datasetCombine/", "combinedDataset/", "object-detection", "coco", "yolov5pytorch")