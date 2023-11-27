package frcdatasetcolab;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.util.Map;

public class DatasetManagement {

    public void convertYOLOtoCOCO(String yoloPath, String cocoPath) {
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

                    JSONArray bboxArray = new JSONArray();
                    bboxArray.add(x);
                    bboxArray.add(y);
                    bboxArray.add(width);
                    bboxArray.add(height);

                    annotation.put("bbox", bboxArray);
                    annotations.add(annotation);
                }

                // Assume the YOLO dataset has a single image
                JSONObject image = new JSONObject();
                image.put("id", imageId);
                image.put("width", 1); // You may need to replace this with the actual image width
                image.put("height", 1); // You may need to replace this with the actual image height
                images.add(image);
            }

            cocoDataset.put("images", images);
            cocoDataset.put("annotations", annotations);

            try (FileWriter fileWriter = new FileWriter(cocoPath)) {
                fileWriter.write(cocoDataset.toJSONString());
            }

            System.out.println("Conversion from YOLO to COCO completed successfully!");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void convertCOCOtoYOLO(String cocoPath, String yoloPath) {
        try {
            JSONParser jsonParser = new JSONParser();
            JSONObject cocoDataset = (JSONObject) jsonParser.parse(new FileReader(cocoPath));

            JSONArray images = (JSONArray) cocoDataset.get("images");
            JSONArray annotations = (JSONArray) cocoDataset.get("annotations");

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(yoloPath))) {
                for (int i = 0; i < images.size(); i++) {
                    JSONObject image = (JSONObject) images.get(i);
                    int imageId = ((Long) image.get("id")).intValue();

                    JSONArray imageAnnotations = new JSONArray();
                    for (int j = 0; j < annotations.size(); j++) {
                        JSONObject annotation = (JSONObject) annotations.get(j);
                        if (((Long) annotation.get("image_id")).intValue() == imageId) {
                            imageAnnotations.add(annotation);
                        }
                    }

                    for (int k = 0; k < imageAnnotations.size(); k++) {
                        JSONObject annotation = (JSONObject) imageAnnotations.get(k);
                        JSONArray bboxArray = (JSONArray) annotation.get("bbox");

                        double x = ((Number) bboxArray.get(0)).doubleValue() * imageId;
                        double y = ((Number) bboxArray.get(1)).doubleValue() * imageId;
                        double width = ((Number) bboxArray.get(2)).doubleValue() * imageId;
                        double height = ((Number) bboxArray.get(3)).doubleValue() * imageId;

                        // Convert COCO format to YOLO format
                        int label = ((Long) annotation.get("category_id")).intValue();
                        writer.write(label + " " + x + " " + y + " " + width + " " + height);
                        writer.newLine();
                    }
                }
            }

            System.out.println("Conversion from COCO to YOLO completed successfully!");
        } catch (IOException | ParseException e) {
            e.printStackTrace();
        }
    }

    public void combineCOCODatasets(String path1, String path2, String outputPath) {
        try {
            JSONParser jsonParser = new JSONParser();
            JSONObject dataset1 = (JSONObject) jsonParser.parse(new FileReader(path1));
            JSONObject dataset2 = (JSONObject) jsonParser.parse(new FileReader(path2));

            JSONArray combinedImages = new JSONArray();
            JSONArray combinedAnnotations = new JSONArray();

            JSONArray images1 = (JSONArray) dataset1.get("images");
            JSONArray annotations1 = (JSONArray) dataset1.get("annotations");

            combinedImages.addAll(images1);
            combinedAnnotations.addAll(annotations1);

            int imageIdOffset = images1.size();

            JSONArray images2 = (JSONArray) dataset2.get("images");
            JSONArray annotations2 = (JSONArray) dataset2.get("annotations");

            for (int i = 0; i < images2.size(); i++) {
                JSONObject image = (JSONObject) images2.get(i);
                image.put("id", ((Long) image.get("id")).intValue() + imageIdOffset);
                combinedImages.add(image);
            }

            for (int i = 0; i < annotations2.size(); i++) {
                JSONObject annotation = (JSONObject) annotations2.get(i);
                annotation.put("id", ((Long) annotation.get("id")).intValue() + imageIdOffset);
                annotation.put("image_id", ((Long) annotation.get("image_id")).intValue() + imageIdOffset);
                combinedAnnotations.add(annotation);
            }

            JSONObject combinedDataset = new JSONObject();
            combinedDataset.put("images", combinedImages);
            combinedDataset.put("annotations", combinedAnnotations);

            try (FileWriter fileWriter = new FileWriter(outputPath)) {
                fileWriter.write(combinedDataset.toJSONString());
            }

            System.out.println("Datasets combined successfully!");
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ParseException e) {
            e.printStackTrace();
        }
    }
}
