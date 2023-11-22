package frcdatasetcolab;

public class DatasetManagement {

  private static void convertYOLOtoCOCO(String yoloPath, String cocoPath) {
        try {
            JSONObject cocoDataset = new JSONObject();
            JSONArray images = new JSONArray();
            JSONArray annotations = new JSONArray();

            try (BufferedReader reader = new BufferedReader(new FileReader(yoloPath))) {
                String line;
                int imageId = 1;
                int annotationId = 1;

                while ((line = reader.readLine()) != null) {
                    String[] parts = line.split(" ");
                    int label = Integer.parseInt(parts[0]);
                    double x = Double.parseDouble(parts[1]);
                    double y = Double.parseDouble(parts[2]);
                    double width = Double.parseDouble(parts[3]);
                    double height = Double.parseDouble(parts[4]);

                    // Convert YOLO format to COCO format
                    JSONObject annotation = new JSONObject();
                    annotation.put("id", annotationId++);
                    annotation.put("image_id", imageId);
                    annotation.put("category_id", label);
                    annotation.put("bbox", new JSONArray().put(x).put(y).put(width).put(height));

                    annotations.put(annotation);
                }

                // Assume the YOLO dataset has a single image
                JSONObject image = new JSONObject();
                image.put("id", imageId);
                image.put("width", 1);  // You may need to replace this with the actual image width
                image.put("height", 1);  // You may need to replace this with the actual image height
                images.put(image);
            }

            cocoDataset.put("images", images);
            cocoDataset.put("annotations", annotations);

            try (FileWriter fileWriter = new FileWriter(cocoPath)) {
                fileWriter.write(cocoDataset.toString());
            }

            System.out.println("Conversion from YOLO to COCO completed successfully!");
        } catch (IOException | JSONException e) {
            e.printStackTrace();
        }
    }

       private static void convertCOCOtoYOLO(String cocoPath, String yoloPath) {
        try {
            JSONObject cocoDataset = new JSONObject(new FileReader(cocoPath));

            JSONArray images = cocoDataset.getJSONArray("images");
            JSONArray annotations = cocoDataset.getJSONArray("annotations");

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(yoloPath))) {
                for (int i = 0; i < images.length(); i++) {
                    JSONObject image = images.getJSONObject(i);
                    int imageId = image.getInt("id");

                    JSONArray imageAnnotations = new JSONArray();
                    for (int j = 0; j < annotations.length(); j++) {
                        JSONObject annotation = annotations.getJSONObject(j);
                        if (annotation.getInt("image_id") == imageId) {
                            imageAnnotations.put(annotation);
                        }
                    }

                    for (int k = 0; k < imageAnnotations.length(); k++) {
                        JSONObject annotation = imageAnnotations.getJSONObject(k);
                        double x = annotation.getDouble("bbox").getDouble(0) / image.getDouble("width");
                        double y = annotation.getDouble("bbox").getDouble(1) / image.getDouble("height");
                        double width = annotation.getDouble("bbox").getDouble(2) / image.getDouble("width");
                        double height = annotation.getDouble("bbox").getDouble(3) / image.getDouble("height");

                        // Convert COCO format to YOLO format
                        int label = annotation.getInt("category_id");
                        writer.write(label + " " + x + " " + y + " " + width + " " + height);
                        writer.newLine();
                    }
                }
            }

            System.out.println("Conversion from COCO to YOLO completed successfully!");
        } catch (IOException | JSONException e) {
            e.printStackTrace();
        }
    }

    public void combineCOCODatasets(String path1, String path2, String outputPath) {
        try {
            JSONObject dataset1 = new JSONObject(new FileReader(path1));
            JSONObject dataset2 = new JSONObject(new FileReader(path2));

            JSONArray combinedImages = new JSONArray(dataset1.getJSONArray("images").toString());
            JSONArray combinedAnnotations = new JSONArray(dataset1.getJSONArray("annotations").toString());

            int imageIdOffset = dataset1.getJSONArray("images").length();

            for (int i = 0; i < dataset2.getJSONArray("images").length(); i++) {
                JSONObject image = dataset2.getJSONArray("images").getJSONObject(i);
                image.put("id", image.getInt("id") + imageIdOffset);
                combinedImages.put(image);
            }

            for (int i = 0; i < dataset2.getJSONArray("annotations").length(); i++) {
                JSONObject annotation = dataset2.getJSONArray("annotations").getJSONObject(i);
                annotation.put("id", annotation.getInt("id") + imageIdOffset);
                annotation.put("image_id", annotation.getInt("image_id") + imageIdOffset);
                combinedAnnotations.put(annotation);
            }

            JSONObject combinedDataset = new JSONObject();
            combinedDataset.put("images", combinedImages);
            combinedDataset.put("annotations", combinedAnnotations);

            try (FileWriter fileWriter = new FileWriter(outputPath)) {
                fileWriter.write(combinedDataset.toString());
            }

            System.out.println("Datasets combined successfully!");
        } catch (IOException | JSONException e) {
            e.printStackTrace();
        }
    }
}
