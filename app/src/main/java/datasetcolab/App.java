package datasetcolab;
import uploaders.Roboflow;
import uploaders.COCO;
import utils.Utils;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import io.javalin.Javalin;
import io.javalin.community.ssl.SSLPlugin;
import io.javalin.http.UploadedFile;
import java.io.*;
import java.util.*;
import java.util.ArrayList;
import java.text.SimpleDateFormat;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.json.simple.JSONArray;
import java.util.concurrent.CompletableFuture;

import io.javalin.Javalin;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class App {

    public static void populateTree(String folderPath, JSONObject result) {
        File folder = new File(folderPath);
        if (folder.exists() && folder.isDirectory()) {
            File[] files = folder.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        JSONObject subFolder = new JSONObject();
                        result.put(file.getName(), subFolder);
                        populateTree(file.getPath(), subFolder);
                    } else {
                        String fileName = file.getName().toLowerCase();
                        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png") ||
            fileName.endsWith(".gif") || fileName.endsWith(".bmp") || fileName.endsWith(".webp")) {
                            result.put(file.getName(), "Image");
                        }
                    }
                }
            }
        } else {
            result.put("error", "Invalid folder path or not a directory.");
        }
    }
    
    private static String validAPI(String api) {
        JSONObject apiJsonObject;
        try {
            String content = Files.readString(Path.of("api.json"));
            apiJsonObject = new JSONObject((Map <?,?> ) new JSONParser().parse(content));

            for (Object entryObj: apiJsonObject.entrySet()) {
                Map.Entry <?,?> entry = (Map.Entry <?,?> ) entryObj;
                if (entry.getValue().equals(api)) {
                    return entry.getKey().toString();
                }
            }

        } catch (IOException | ParseException e) {
            e.printStackTrace();
        }

        return null;
    }

    private static Utils mainUtils = new Utils();

    public static void main(String[] args) {
        try {
            FileInputStream serviceAccount = new FileInputStream(
                "admin.json"
            );
            FirebaseOptions options = new FirebaseOptions.Builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();
            FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            e.printStackTrace();
            return;
        }

        Javalin app = Javalin
            .create(config -> {
                config.plugins.enableCors(cors -> {
                    cors.add(corsConfig -> {
                        corsConfig.anyHost();
                    });
                });
                config.plugins.register(
                    new SSLPlugin(ssl -> {
                        ssl.host = "10.0.0.107";
                        ssl.insecurePort = 80;
                        ssl.securePort = 443;
                        ssl.pemFromPath("fullchain.pem", "privkey.pem");
                    })
                );
            })
            .start();

        app.get("/dataset/view",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                        String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(idToken);
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                        String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                        uid = validAPI(api);
                    } else {
                        throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                    }

                    String directoryPath = "upload/" + uid;
                    File directory = new File(directoryPath);
                    if (directory.exists() && directory.isDirectory()) {
                        String[] fileNames = directory.list();
                        if (fileNames != null) {
                            JSONArray filesArray = new JSONArray();

                            for (String fileName: fileNames) {
                                String metadataFilePath = "upload/" + uid + "/" + fileName + "/metadata.json";
                                File metadataFile = new File(metadataFilePath);
                                if (metadataFile.exists() && metadataFile.isFile()) {
                                    try (FileReader fileReader = new FileReader(metadataFile)) {
                                        JSONParser parser = new JSONParser();
                                        JSONObject metadata = (JSONObject) parser.parse(fileReader);
                                        filesArray.add(metadata);
                                    }
                                }
                            }

                            ctx.json(filesArray);
                        } else {
                            ctx.result("No metadata files found in the directory.");
                        }
                    } else {
                        ctx.result("Directory does not exist for the user.");
                    }
                } catch (FirebaseAuthException | ParseException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        app.get("/dataset/view/<folderName>", ctx -> {
            try {
                String uid = "";
                if (!ctx.pathParam("folderName").startsWith("FRC2023") && !ctx.pathParam("folderName").startsWith("FRC2024")) {
                    if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                        String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(idToken);
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                        String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                        uid = validAPI(api);
                    } else {
                        throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                    }
                }

                String folderName = ctx.pathParam("folderName");
                String requestedFile = "upload/" + uid + "/" + folderName;
                if (folderName.startsWith("FRC2023") || folderName.startsWith("FRC2024")) {
                    File datasetFile = new File("important.json");
                    try (FileReader fileReader = new FileReader(datasetFile)) {
                        JSONParser parser = new JSONParser();
                        JSONObject currentDataset = (JSONObject) parser.parse(fileReader);

                        if (folderName.contains("/")) {
                            String folderNameSubstring = folderName.substring(0, folderName.indexOf("/"));
                            requestedFile = "download/" + (String) currentDataset.get(folderNameSubstring) + folderName.substring(folderName.indexOf(folderNameSubstring) + folderNameSubstring.length());
                        } else {
                            requestedFile = "download/" + (String) currentDataset.get(folderName);
                        }
                    }
                }

                if (requestedFile.matches(".*\\.(jpg|jpeg|png|webp)$")) {
                    File imageFile = new File(requestedFile);

                    if (imageFile.exists() && imageFile.isFile()) {
                        ctx.result(Files.readAllBytes(imageFile.toPath()));
                    } else {
                        ctx.result("Image file not found for the specified path.");
                    }
                } else {
                    String metadataFilePath = requestedFile + "/metadata.json";
                    File metadataFile = new File(metadataFilePath);

                    JSONObject treeObject = new JSONObject();
                    if (ctx.header("noTree") == null || !Boolean.parseBoolean(ctx.header("noTree"))) {
                        populateTree(requestedFile, treeObject);
                    }

                    if (metadataFile.exists() && metadataFile.isFile()) {
                        try (FileReader fileReader = new FileReader(metadataFile)) {
                            JSONParser parser = new JSONParser();
                            JSONObject metadata = (JSONObject) parser.parse(fileReader);
                            if (ctx.header("noTree") == null || !Boolean.parseBoolean(ctx.header("noTree"))) {
                                metadata.put("tree", treeObject);
                            }
                            ctx.json(metadata);
                        }
                    } else {
                        JSONObject result = new JSONObject();
                        if (ctx.header("noTree") == null || !Boolean.parseBoolean(ctx.header("noTree"))) {
                            result.put("tree", treeObject);
                        }
                        ctx.json(result);
                    }
                }
            } catch (FirebaseAuthException | ParseException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });

        app.get("/dataset/metadata/<folderName>", ctx -> {
            try {
                String uid = "";
                if (!ctx.pathParam("folderName").startsWith("FRC2023") && !ctx.pathParam("folderName").startsWith("FRC2024")) {
                    if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                        String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(idToken);
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                        String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                        uid = validAPI(api);
                    } else {
                        throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                    }
                }

                String folderName = ctx.pathParam("folderName");
                if (folderName.startsWith("FRC2023") || folderName.startsWith("FRC2024")) {
                    File datasetFile = new File("important.json");
                    try (FileReader readFileReader = new FileReader(datasetFile)) {
                        JSONParser parser = new JSONParser();
                        JSONObject currentDataset = (JSONObject) parser.parse(readFileReader);
                        if (currentDataset.get(folderName) != null) {
                            String metadataFilePath = "download/" + (String) currentDataset.get(folderName) + "/metadata.json";
                            File metadataFile = new File(metadataFilePath);

                            if (metadataFile.exists() && metadataFile.isFile()) {
                                try (FileReader writeFileReader = new FileReader(metadataFile)) {
                                    JSONParser writeParser = new JSONParser();
                                    JSONObject metadata = (JSONObject) writeParser.parse(writeFileReader);
                                    ctx.json(metadata);
                                }
                            }
                        } else {
                            JSONObject result = new JSONObject();
                            result.put("totalImageCount", 0);
                            result.put("totalAnnotationCount", 0);
                            result.put("zipSize", 0);
                            ctx.json(result);
                        }
                    }
                }
            } catch (FirebaseAuthException | ParseException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });

        app.get("/dataset/annotations/<folderName>", ctx -> {
            try {
                String uid = "";
                if (!ctx.pathParam("folderName").startsWith("FRC2023") && !ctx.pathParam("folderName").startsWith("FRC2024")) {
                    if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                        String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(idToken);
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                        String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                        uid = validAPI(api);
                    } else {
                        throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                    }
                }

                String folderName = "upload/" + uid + "/" + ctx.pathParam("folderName");
                if (ctx.pathParam("folderName").startsWith("FRC2023") || ctx.pathParam("folderName").startsWith("FRC2024")) {
                    File datasetFile = new File("important.json");
            
                    String folderNameSubstring = ctx.pathParam("folderName").substring(0, ctx.pathParam("folderName").indexOf("/"));

                    try (FileReader fileReader = new FileReader(datasetFile)) {
                        JSONParser parser = new JSONParser();
                        JSONObject currentDataset = (JSONObject) parser.parse(fileReader);

                        folderName = "download/" + (String) currentDataset.get(folderNameSubstring) + ctx.pathParam("folderName").substring(ctx.pathParam("folderName").indexOf(folderNameSubstring) + folderNameSubstring.length());
                    }
                }

                String[] folderNameArray = folderName.split("/");
                List<String> folderNameList = new ArrayList<>(Arrays.asList(folderNameArray));

                String imageName = folderNameList.get(folderNameList.size() - 1);
                folderNameList.remove(folderNameList.size() - 1);

                String filePath = String.join("/", folderNameList);

                File folder = new File(filePath);
                File[] files = folder.listFiles((dir, name) -> name.toLowerCase().endsWith(".json"));

                JSONArray outAnnotations = new JSONArray();

                if (files != null) {
                    for (File file : files) {
                        if (file.getName().endsWith(".json")) {
                            try (FileReader fileReader = new FileReader(file)) {
                                JSONParser parser = new JSONParser();
                                JSONObject json = (JSONObject) parser.parse(fileReader);

                                Long imageID = null;
                                JSONArray images = (JSONArray) json.get("images");
                                for (Object image : images) {
                                    JSONObject imageObj = (JSONObject) image;
                                    if (imageObj.get("file_name").equals(imageName)) {
                                        imageID = (Long) imageObj.get("id");
                                        break;
                                    }
                                }

                                JSONArray annotations = (JSONArray) json.get("annotations");
                                for (Object annotation : annotations) {
                                    JSONObject annotationObj = (JSONObject) annotation;
                                    if (annotationObj.get("image_id").equals(imageID)) {
                                
                                        String categoryName = "";
                                        JSONArray categories = (JSONArray) json.get("categories");
                                        for (Object category : categories) {
                                            JSONObject categoryObj = (JSONObject) category;
                                            if (categoryObj.get("id").equals(annotationObj.get("category_id"))) {
                                                categoryName = (String) categoryObj.get("name");
                                            }
                                        }

                                        annotationObj.put("category_name", categoryName);
                                        outAnnotations.add(annotationObj);
                                    }
                                }
                            }
                        }
                    }
                }
                ctx.json(outAnnotations);
            } catch (FirebaseAuthException | ParseException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });


        app.get("/dataset/delete/{folderName}", ctx -> {
            try {
                String uid = "";
                if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                    String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(idToken);
                    uid = decodedToken.getUid();
                } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                    String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                    uid = validAPI(api);
                } else {
                    throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                }

                String folderName = ctx.pathParam("folderName");

                mainUtils.executeCommand("rm -fr upload/" + uid + "/" + folderName);
            } catch (FirebaseAuthException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });

        app.post("/dataset/upload",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                        String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(idToken);
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                        String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                        uid = validAPI(api);
                    } else {
                        throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                    }

                    Date date = new Date();
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH:mm");

                    String uploadTime = dateFormat.format(date);
                    String uploadName = ctx.header("uploadName");
                    String folderName = mainUtils.generateRandomString(8);
                    String datasetType = ctx.header("datasetType");
                    String targetDataset = ctx.header("targetDataset");
                    String exportLink = "";
                    JSONArray parsedNamesUpload = new JSONArray();

                    JSONObject metadata = new JSONObject();

                    if ("COCO".equals(datasetType)) {
                        COCO uploader = new COCO();
                        uploader.upload(folderName, ctx.uploadedFiles("files"), uid);
                        Set<String> parsedNames = uploader.parsedNames;
                        parsedNamesUpload.addAll(parsedNames);
                    } else if ("ROBOFLOW".equals(datasetType)) {
                        Roboflow uploader = new Roboflow();
                        exportLink = uploader.upload(folderName, ctx.header("roboflowUrl"), uid);
                        uploadName = uploader.getProjectFromUrl(ctx.header("roboflowUrl"));
                        Set<String> parsedNames = new HashSet<>(uploader.classes);
                        parsedNamesUpload.addAll(parsedNames);
                    }

                    metadata.put("uploadTime", uploadTime);
                    metadata.put("uploadName", uploadName);
                    metadata.put("datasetType", datasetType);
                    metadata.put("targetDataset", targetDataset);
                    metadata.put("folderName", folderName);
                    metadata.put("classes", parsedNamesUpload);
                    metadata.put("status", "postprocessing");

                    File metadataDirectory = new File("upload/" + uid + "/" + folderName);
                    metadataDirectory.mkdirs();

                    final String metadataFilePath = metadataDirectory.getPath() + "/metadata.json";
                    try (FileWriter file = new FileWriter(metadataFilePath)) {
                        file.write(metadata.toJSONString());
                        file.flush();
                    } catch (IOException e) {
                        e.printStackTrace();
                        ctx.status(500).result("Error: Failed to save metadata on the server.");
                        return;
                    }

                    final String finalUid = uid;
                    final String finalExportLink = exportLink;

                    ctx.json(metadata);

                    CompletableFuture.runAsync(() -> {
                        if ("ROBOFLOW".equals(metadata.get("datasetType"))) {
                            Roboflow uploader = new Roboflow();
                            uploader.postUpload(finalUid, (String) metadata.get("folderName"), (String) finalExportLink);
                        }

                        metadata.put("status", "pendingmerge");
                        
                        try (FileWriter file = new FileWriter(metadataFilePath)) {
                            file.write(metadata.toJSONString());
                            file.flush();
                        } catch (IOException e) {
                            e.printStackTrace();
                            ctx.status(500).result("Error: Failed to save metadata on the server.");
                            return;
                        }
                    });

                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        app.get("/dataset/download/<filePath>", ctx -> {
            try {
                String uid = "";
                if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                    String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(idToken);
                    uid = decodedToken.getUid();
                } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                    String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                    uid = validAPI(api);
                } else {
                    throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                }

                String filePath = ctx.pathParam("filePath");

                if (ctx.queryParam("classes") == null) {
                    return;
                }

                if (filePath.equals("FRC2023") || filePath.equals("FRC2024")) {
                    File datasetFile = new File("important.json");

                    try (FileReader fileReader = new FileReader(datasetFile)) {
                        JSONParser parser = new JSONParser();
                        JSONObject currentDataset = (JSONObject) parser.parse(fileReader);
                        String zipName = "download/" + (String) currentDataset.get(filePath + ctx.queryParam("datasetType") + ctx.queryParam("classes")) + ".zip";

                        try (InputStream is = Files.newInputStream(Path.of(zipName))) {
                            // Set response headers
                            ctx.header("Content-Disposition", "attachment; filename=" + filePath + ".zip");
                            ctx.contentType("application/zip");

                            // Get the OutputStream from the HttpServletResponse
                            OutputStream outputStream = ctx.res().getOutputStream();

                            // Write the input stream to the response output stream
                            byte[] buffer = new byte[4096]; // Adjust the buffer size as needed
                            int bytesRead;

                            while ((bytesRead = is.read(buffer)) != -1) {
                                outputStream.write(buffer, 0, bytesRead);
                            }

                            // Close the input stream and output stream
                            is.close();
                            outputStream.close();
                        } catch (IOException e) {
                            // Handle exceptions
                            ctx.status(500).result("Error: Failed to read or stream the file.");
                        }

                    } catch (IOException | ParseException e) {
                        // Handle exceptions
                        ctx.status(500).result("Error: Failed to read or parse JSON file.");
                    }
                } else {
                    File file = new File(filePath);

                    if (file.exists() && file.isFile()) {
                        ctx.result(Files.readAllBytes(file.toPath()))
                                .header("Content-Disposition", "attachment; filename=" + file.getName());
                    } else {
                        ctx.status(404).result("Error: File not found.");
                    }
                }
            } catch (FirebaseAuthException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });

        app.get("/model/download/{model}", ctx -> {
            try {
                String uid = "";
                if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                    String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(idToken);
                    uid = decodedToken.getUid();
                } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                    String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                    uid = validAPI(api);
                } else {
                    throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                }

                String model = ctx.pathParam("model");
                String fileName = "models/" + model + "NORO/weights/best.pt";

                try (InputStream is = Files.newInputStream(Path.of(fileName))) {
                    // Set response headers
                    ctx.header("Content-Disposition", "attachment; filename=" + model + ".pt");
                    ctx.contentType("application/zip");

                    // Get the OutputStream from the HttpServletResponse
                    OutputStream outputStream = ctx.res().getOutputStream();

                    // Write the input stream to the response output stream
                    byte[] buffer = new byte[4096]; // Adjust the buffer size as needed
                    int bytesRead;

                    while ((bytesRead = is.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }

                    // Close the input stream and output stream
                    is.close();
                    outputStream.close();
                } catch (IOException e) {
                    // Handle exceptions
                    ctx.status(500).result("Error: Failed to read or stream the file.");
                }
            } catch (FirebaseAuthException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });

        app.get("/model/inference/{model}/{image}", ctx -> {
            File imageFile = new File("models/" + ctx.pathParam("model") + "NORO/images/processed_" + ctx.pathParam("image") + ".jpg");
            if (imageFile.exists() && imageFile.isFile()) {
                ctx.result(Files.readAllBytes(imageFile.toPath()));
            } else {
                ctx.result("Image file not found for the specified path.");
            }
        });

        app.get("/model/performance/{model}", ctx -> {
            String model = ctx.pathParam("model");
            String csvFilePath = "models/" + model + "/results.csv";

            // Read the CSV file
            try (BufferedReader reader = new BufferedReader(new FileReader(csvFilePath))) {
                String line;
                String[] headers = null;
                String[] maxValues = null;

                // Read the headers
                if ((line = reader.readLine()) != null) {
                    headers = line.split(",");
                }

                // Read the remaining rows and find the maximum value in each column
                while ((line = reader.readLine()) != null) {
                    String[] values = line.split(",");
                    if (maxValues == null) {
                        maxValues = values;
                    } else {
                        for (int i = 0; i < values.length; i++) {
                            double currentValue = Double.parseDouble(values[i].trim());
                            double maxValue = Double.parseDouble(maxValues[i].trim());
                            if (currentValue > maxValue) {
                                maxValues[i] = values[i];
                            }
                        }
                    }
                }

                // Create a JSON object with the headers and maximum values
                Map<String, String> jsonMap = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    String key = headers[i].replaceAll("\\s", ""); // Remove spaces from the key
                    String value = maxValues[i].replaceAll("\\s", ""); // Remove spaces from the value
                    jsonMap.put(key, value);
                }

                // Return the JSON object
                ctx.json(jsonMap);
            } catch (IOException e) {
                e.printStackTrace();
                ctx.status(500).result("Error: Failed to read the CSV file.");
            }
        });

        app.get(
            "/api",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                        String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(idToken);
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                        String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                        uid = validAPI(api);
                    } else {
                        throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                    }

                    boolean newKey = false;
                    String newKeyString = ctx.header("new");
                    try {
                        if (newKeyString != null && newKeyString.equals("true")) {
                            newKey = true;
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                    JSONObject apiJsonObject;
                    try {
                        String content = Files.readString(Path.of("api.json"));
                        apiJsonObject = new JSONObject((Map <?,?> ) new JSONParser().parse(content));
                    } catch (IOException | ParseException e) {
                        e.printStackTrace();
                        apiJsonObject = new JSONObject();
                        newKey = true;
                    }

                    String apiKey = mainUtils.generateRandomString(24);
                    if (apiJsonObject.containsKey(uid) && !newKey) {
                        apiKey = (String) apiJsonObject.get(uid);
                    } else {
                        apiJsonObject.put(uid, apiKey);
                    }

                    try {
                        String jsonString = apiJsonObject.toJSONString();
                        Files.write(Path.of("api.json"), jsonString.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    ctx.result(apiKey);

                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );


        app.get("/dataset/classes",
            ctx -> {
                try {
                String uid = "";
                if (ctx.header("idToken") != null || ctx.queryParam("idToken") != null) {
                    String idToken = ctx.header("idToken") != null ? ctx.header("idToken") : ctx.queryParam("idToken");
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(idToken);
                    uid = decodedToken.getUid();
                } else if (ctx.header("api") != null || ctx.queryParam("api") != null) {
                    String api = ctx.header("api") != null ? ctx.header("api") : ctx.queryParam("api");
                    uid = validAPI(api);
                } else {
                    throw new IllegalArgumentException("Invalid request: uid is null or both idToken and api are null.");
                }

                final String finalUid = uid;
            
                String classesHeader = ctx.header("classes");
                final String mapClassesHeader = ctx.header("mapClasses");

                Map<String, String> classMap = new HashMap<>();

                if (classesHeader != null && mapClassesHeader != null &&
                    !classesHeader.isEmpty() && !mapClassesHeader.isEmpty()) {

                    String[] classes = classesHeader.split(",");
                    String[] mapClasses = mapClassesHeader.split(",");

                    for (int i = 0; i < classes.length; i++) {
                        classMap.put(classes[i].trim(), mapClasses[i].trim());
                    }
                }

                CompletableFuture.runAsync(() -> {
                    try {
                        JSONObject metadata;
                        try {
                            metadata = new JSONObject((Map<?, ?>) new JSONParser().parse(ctx.header("metadata")));
                        } catch (ParseException e) {
                            e.printStackTrace();
                            metadata = new JSONObject();
                        }

                        // wait for postprocessing to complete
                        File metadataFile = new File("upload/" + finalUid + "/" + metadata.get("folderName") + "/metadata.json");
                        while (!metadata.get("status").equals("pendingmerge")) {
                            try (FileReader fileReader = new FileReader(metadataFile)) {
                                JSONParser parser = new JSONParser();
                                metadata = (JSONObject) parser.parse(fileReader);
                            } catch (IOException | ParseException e) {
                                e.printStackTrace();
                            }
                            Thread.sleep(5000);
                        }

                        // class matching
                        File folder = new File("upload/" + finalUid + "/" + metadata.get("folderName"));
                        List<File> fileList = new ArrayList<>();
                        Files.walk(Paths.get(folder.getAbsolutePath()))
                            .filter(Files::isRegularFile)
                            .filter(path -> path.toString().toLowerCase().endsWith(".json"))
                            .forEach(path -> fileList.add(path.toFile()));
                        File[] files = fileList.toArray(new File[0]);
                        if (files != null) {
                            for (File file : files) {
                                if (!file.getName().equals("metadata.json")) {
                                    try (FileReader fileReader = new FileReader(file)) {
                                        JSONParser parser = new JSONParser();
                                        JSONObject json = (JSONObject) parser.parse(fileReader);

                                        JSONArray categoriesArray = (JSONArray) json.get("categories");

                                        for (int i = 0; i < categoriesArray.size(); i++) {
                                            JSONObject category = (JSONObject) categoriesArray.get(i);
                                            String oldCategoryName = (String) category.get("name");

                                            if (classMap.containsKey(oldCategoryName)) {
                                                category.put("name", classMap.get(oldCategoryName));
                                                categoriesArray.set(i, category);
                                                json.put("categories", categoriesArray);
                                            }
                                        }

                                        try (FileWriter fileWriter = new FileWriter(file)) {
                                            fileWriter.write(json.toJSONString());
                                        } catch (IOException e) {
                                            e.printStackTrace();
                                        }

                                    }
                                }
                            }
                        }

                        // Save new classes to metadata file
                        metadata.put("classes", Arrays.asList(mapClassesHeader.split(",")));
                        try (FileWriter fileWriter = new FileWriter(metadataFile)) {
                            fileWriter.write(metadata.toJSONString());
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        ctx.status(500).result("Error: Failed to process dataset.");
                    }
                });
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        app.get(
            "/test",
            ctx -> ctx.status(200)
        );

    }
}
