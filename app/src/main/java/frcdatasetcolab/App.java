package frcdatasetcolab;
import roboflow.RoboflowDownloader;
import utils.RandomString;

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

public class App {

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
                        ssl.insecurePort = 7070;
                        ssl.securePort = 3433;
                        ssl.pemFromPath("fullchain.pem", "privkey.pem");
                    })
                );
            })
            .start();

        app.get(
            "/view",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

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


        app.post(
            "/upload",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    Date date = new Date();
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH:mm");
                    String formattedDate = dateFormat.format(date);

                    if (ctx.header("roboflowUrl").equals("")) {
                        RandomString random = new RandomString();
                        String folderName = random.generateRandomString(8);

                        JSONObject metadata = new JSONObject();
                        metadata.put("uploadTime", formattedDate);
                        metadata.put("uploadName", ctx.header("name"));
                        metadata.put("datasetType", ctx.header("datasetType"));
                        metadata.put("targetDataset", ctx.header("targetDataset"));

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

                        for (UploadedFile uploadedFile: ctx.uploadedFiles("files")) {
                            String filePath = "upload/" + uid + "/" + folderName + "/" + uploadedFile.filename();
                            System.out.println(filePath);

                            File directory = new File(filePath).getParentFile();
                            if (!directory.exists()) {
                                directory.mkdirs();
                            }

                            try (
                                InputStream fileContent = uploadedFile.content(); OutputStream output = new FileOutputStream(filePath)
                            ) {
                                byte[] buffer = new byte[8192];
                                int bytesRead;
                                while ((bytesRead = fileContent.read(buffer)) != -1) {
                                    output.write(buffer, 0, bytesRead);
                                }
                            } catch (IOException e) {
                                e.printStackTrace();
                                ctx.status(500).result("Error: Failed to save the file on the server.");
                                return;
                            }
                        }
                    } else {
                        RoboflowDownloader downloader = new RoboflowDownloader();
                        String folderName = downloader.downloadDataset(ctx.header("roboflowUrl"), uid);
                    
                        JSONObject metadata = new JSONObject();
                        metadata.put("uploadTime", formattedDate);
                        metadata.put("uploadName", downloader.getProjectFromUrl(ctx.header("roboflowUrl")));
                        metadata.put("datasetType", "COCO");
                        metadata.put("targetDataset", ctx.header("targetDataset"));

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
                    }
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        app.get(
            "/newapikey",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    JSONObject apiJsonObject;
                    try {
                        String content = Files.readString(Path.of("api.json"));
                        apiJsonObject = new JSONObject((Map<?, ?>) new JSONParser().parse(content));
                    } catch (IOException | ParseException e) {
                        e.printStackTrace();
                        apiJsonObject = new JSONObject();
                    }

                    RandomString random = new RandomString();
                    String newApiKey = random.generateRandomString(24);
                    if (apiJsonObject.containsKey(uid)) {
                        apiJsonObject.put(uid, newApiKey);
                    } else {
                        apiJsonObject.put(uid, newApiKey);
                    }

                    try {
                        String jsonString = apiJsonObject.toJSONString();
                        Files.write(Path.of("api.json"), jsonString.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    ctx.result(newApiKey);
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        app.get(
            "/getapikey",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    JSONObject apiJsonObject;
                    try {
                        String content = Files.readString(Path.of("api.json"));
                        apiJsonObject = new JSONObject((Map<?, ?>) new JSONParser().parse(content));
                    } catch (IOException | ParseException e) {
                        e.printStackTrace();
                        ctx.status(500).result("Error: Unable to read API keys.");
                        return;
                    }

                    if (apiJsonObject.containsKey(uid)) {
                        String apiKey = (String) apiJsonObject.get(uid);
                        ctx.result(apiKey);
                    } else {
                        ctx.status(404).result("Error: API key not found for the user.");
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
