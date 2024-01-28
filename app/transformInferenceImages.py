import os
from PIL import Image

# Define the list of model names
model_names = ["YOLOv8n", "YOLOv8s", "YOLOv5s", "YOLOv5n"]

# Iterate through the model names
for model_name in model_names:
    for batch_num in range(3):  # Iterate through batch numbers 0, 1, and 2
        # Open the image grid
        image_grid = Image.open(f"/home/team4169/datasetcolab/app/models/{model_name}NORO/val_batch{batch_num}_pred.jpg")

        # Get the size of each individual image
        image_width = image_grid.width // 4
        image_height = image_grid.height // 4

        # Split the image grid into individual images
        for i in range(4):
            for j in range(4):
                # Calculate the coordinates of the current image
                left = j * image_width
                upper = i * image_height
                right = left + image_width
                lower = upper + image_height

                # Crop the current image from the image grid
                image = image_grid.crop((left, upper, right, lower))

                # Create the directory if it doesn't exist
                os.makedirs(f"/home/team4169/datasetcolab/app/models/{model_name}NORO/images", exist_ok=True)

                # Save the cropped image with the appropriate label
                image.save(f"/home/team4169/datasetcolab/app/models/{model_name}NORO/images/processed_{batch_num * 16 + i * 4 + j}.jpg")