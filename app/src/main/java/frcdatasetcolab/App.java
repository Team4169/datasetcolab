package frcdatasetcolab;
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
import java.text.SimpleDateFormat;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.json.simple.JSONArray;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.concurrent.CompletableFuture;

import io.javalin.Javalin;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
public class App {

    public static void populateTree(String folderPath, JSONObject result) {
        File folder = new File(folderPath);
        if (folder.exists() && folder.isDirectory()) {
            File[] files = folder.listFiles();
            if (files != null) {
                for (File file: files) {
                    if (file.isDirectory()) {
                        JSONObject subFolder = new JSONObject();
                        result.put(file.getName(), subFolder);
                        populateTree(file.getPath(), subFolder);
                    } else {
                        if (isImageFile(file)) {
                            result.put(file.getName(), "Image");
                        }
                    }
                }
            }
        } else {
            result.put("error", "Invalid folder path or not a directory.");
        }
    }

    private static boolean isImageFile(File file) {
        String fileName = file.getName().toLowerCase();
        return fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png") ||
            fileName.endsWith(".gif") || fileName.endsWith(".bmp") || fileName.endsWith(".webp");
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

    private static String generateTemporaryLink(String filename) {
        Path basePath = Paths.get("https://api.datasetcolab.com");
        return basePath.resolve("/download/" + filename).toString();
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
                        ssl.host = "10.0.0.142";
                        ssl.insecurePort = 80;
                        ssl.securePort = 443;
                        ssl.pemFromPath("fullchain.pem", "privkey.pem");
                    })
                );
            })
            .start();

        app.get(
            "/view",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null) {
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(ctx.header("idToken"));
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null) {
                        String api = ctx.header("api");
                        uid = validAPI(api);
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

        app.get("/view/<folderName>", ctx -> {
            try {
                    String uid = "";
                    if (ctx.header("idToken") != null) {
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(ctx.header("idToken"));
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null) {
                        String api = ctx.header("api");
                        uid = validAPI(api);
                    }

                String folderName = ctx.pathParam("folderName");
                String requestedFile = "upload/" + uid + "/" + folderName;

                // Check if the requested path ends with an image extension
                if (requestedFile.matches(".*\\.(jpg|jpeg|png|webp)$")) {
                    System.out.println(requestedFile);
                    File imageFile = new File(requestedFile);


                    if (imageFile.exists() && imageFile.isFile()) {
                        byte[] imageBytes = Files.readAllBytes(imageFile.toPath());
                        System.out.println(imageBytes.length);
                        ByteArrayInputStream result = new ByteArrayInputStream(imageBytes);
                        ctx.result(imageBytes);
                        String contentType;
                        if (requestedFile.matches(".*\\.jpg$")) {
                            contentType = "image/jpeg";
                        } else if (requestedFile.matches(".*\\.png$")) {
                            contentType = "image/png";
                        } else if (requestedFile.matches(".*\\.webp$")) {
                            contentType = "image/webp";
                        } else {
                            // Handle unsupported image formats or set a default content type
                            contentType = "image/jpeg"; // Change this as needed
                        }

                        ctx.contentType(contentType);
                    } else {
                        ctx.result("Image file not found for the specified path.");
                    }

                } else {
                    String metadataFilePath = requestedFile + "/metadata.json";
                    System.out.println(metadataFilePath);
                    File metadataFile = new File(metadataFilePath);

                    // Always return populatedTree, even if metadata does not exist
                    String folderPath = "upload/" + uid + "/" + folderName;

                    JSONObject treeObject = new JSONObject();
                    populateTree(folderPath, treeObject);


                    if (metadataFile.exists() && metadataFile.isFile()) {
                        try (FileReader fileReader = new FileReader(metadataFile)) {
                            JSONParser parser = new JSONParser();
                            JSONObject metadata = (JSONObject) parser.parse(fileReader);
                            metadata.put("tree", treeObject);
                            ctx.json(metadata);
                        }
                    } else {
                        // If metadata does not exist, return tree as the main response
                        JSONObject result = new JSONObject();
                        result.put("tree", treeObject);
                        ctx.json(result);
                    }
                }
            } catch (FirebaseAuthException | ParseException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });

        app.get("/delete/{folderName}", ctx -> {
            try {
                FirebaseToken decodedToken = FirebaseAuth
                    .getInstance()
                    .verifyIdToken(ctx.header("idToken"));
                String uid = decodedToken.getUid();

                String folderName = ctx.pathParam("folderName");

                mainUtils.executeCommand("rm -fr upload/" + uid + "/" + folderName);
            } catch (FirebaseAuthException e) {
                e.printStackTrace();
                ctx.status(401).result("Error: Authentication failed.");
            }
        });

        app.post(
            "/upload",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null) {
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(ctx.header("idToken"));
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null) {
                        String api = ctx.header("api");
                        uid = validAPI(api);
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
                    } else if ("ROBOFLOW".equals(datasetType)) {
                        Roboflow uploader = new Roboflow();
                        exportLink = uploader.upload(folderName, ctx.header("roboflowUrl"), uid);
                        uploadName = uploader.getProjectFromUrl(ctx.header("roboflowUrl"));
                        Set < String > parsedNames = uploader.classes;
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

                    String metadataFilePath = metadataDirectory.getPath() + "/metadata.json";

                    try (FileWriter file = new FileWriter(metadataFilePath)) {
                        file.write(metadata.toJSONString());
                        file.flush();
                    } catch (IOException e) {
                        e.printStackTrace();
                        ctx.status(500).result("Error: Failed to save metadata on the server.");
                        return;
                    }

                    ctx.json(metadata);

                    final String finalExportLink = exportLink;
                    final String finalUid = uid;

                    CompletableFuture.runAsync(() -> {
                        try {
                            if ("COCO".equals(datasetType)) {
                                COCO uploader = new COCO();
                                uploader.postUpload(finalUid, folderName);
                                Set < String > parsedNames = uploader.parsedNames;
                                parsedNamesUpload.addAll(parsedNames);
                                metadata.put("classes", parsedNamesUpload);
                            } else if ("ROBOFLOW".equals(datasetType)) {
                                Roboflow uploader = new Roboflow();
                                uploader.postUpload(finalUid, folderName, finalExportLink);
                            }

                            metadata.put("status", "merged");

                            try (FileWriter file = new FileWriter(metadataFilePath)) {
                                file.write(metadata.toJSONString());
                                file.flush();
                            } catch (IOException e) {
                                e.printStackTrace();
                                ctx.status(500).result("Error: Failed to save metadata on the server.");
                                return;
                            }

                            String tempName = mainUtils.generateRandomString(4);
                            mainUtils.executeCommand("python3 combineDatasets.py " + targetDataset + " " + tempName);
                            mainUtils.zipDirectory(tempName + "Main", tempName + "Main" + ".zip");

                            File datasetFile = new File("currentDataset.json");
                            try (FileReader fileReader = new FileReader(datasetFile)) {
                                JSONParser parser = new JSONParser();
                                JSONObject currentDataset = (JSONObject) parser.parse(fileReader);
                                String oldTempName = (String) currentDataset.get(targetDataset);

                                currentDataset.put(targetDataset, tempName + "Main.zip");

                                try (FileWriter file = new FileWriter("currentDataset.json")) {
                                    file.write(currentDataset.toJSONString());
                                    file.flush();
                                } catch (IOException e) {
                                    e.printStackTrace();
                                    ctx.status(500).result("Error: Failed to save metadata on the server.");
                                }

                                mainUtils.executeCommand("rm  " + oldTempName);
                                mainUtils.executeCommand("rm -fr " + tempName + "Main");

                            } catch (IOException | ParseException e) {
                                e.printStackTrace();
                                ctx.status(500).result("Error: Failed to read dataset file.");
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
            "/download",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null) {
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(ctx.header("idToken"));
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null) {
                        String api = ctx.header("api");
                        uid = validAPI(api);
                    }

                    String targetDataset = ctx.header("targetDataset");
                    if (targetDataset.equals("FRC2023") || targetDataset.equals("FRC2024")) {

                        File datasetFile = new File("currentDataset.json");
                        try (FileReader fileReader = new FileReader(datasetFile)) {
                            JSONParser parser = new JSONParser();
                            JSONObject currentDataset = (JSONObject) parser.parse(fileReader);
                            String tempName = (String) currentDataset.get(targetDataset);

                            ctx.result(tempName);
                        }
                    } else {
                        ctx.result("Error: Invalid target dataset.");
                    }

                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }

            }
        );

        app.get("/download/<filePath>", ctx -> {
            File file = new File(ctx.pathParam("filePath"));

            ctx.result(Files.readAllBytes(file.toPath()))
                    .header("Content-Disposition", "attachment; filename=" + file.getName());
        });

        app.get(
            "/api",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null) {
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(ctx.header("idToken"));
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null) {
                        String api = ctx.header("api");
                        uid = validAPI(api);
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

        app.get(
            "/classes",
            ctx -> {
                try {
                    String uid = "";
                    if (ctx.header("idToken") != null) {
                        FirebaseToken decodedToken = FirebaseAuth
                            .getInstance()
                            .verifyIdToken(ctx.header("idToken"));
                        uid = decodedToken.getUid();
                    } else if (ctx.header("api") != null) {
                        String api = ctx.header("api");
                        uid = validAPI(api);
                    }

                    String classesHeader = ctx.header("classes");
                    String mapClassesHeader = ctx.header("mapClasses");

                    Map<String, String> classMap = new HashMap<>();

                    if (classesHeader != null && mapClassesHeader != null &&
                        !classesHeader.isEmpty() && !mapClassesHeader.isEmpty()) {

                        String[] classes = classesHeader.split(",");
                        String[] mapClasses = mapClassesHeader.split(",");

                        for (int i = 0; i < classes.length; i++) {
                            classMap.put(classes[i].trim(), mapClasses[i].trim());
                        }
                    }

                    

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