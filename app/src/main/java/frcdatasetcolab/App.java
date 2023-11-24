package frcdatasetcolab;

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
        // Initialize Firebase outside of the route handler
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
            return; // Exit if there's an error with the service account file
        }

        Javalin app = Javalin
            .create(config - > {
                config.plugins.enableCors(cors - > {
                    cors.add(corsConfig - > {
                        corsConfig.anyHost();
                    });
                });
                config.plugins.register(
                    new SSLPlugin(ssl - > {
                        ssl.host = "10.0.0.142";
                        ssl.insecurePort = 7070;
                        ssl.securePort = 3433;
                        ssl.pemFromPath("fullchain.pem", "privkey.pem");
                    })
                );
            })
            .start();

        app.get(
            "/files",
            ctx - > {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    String directoryPath = "upload/" + uid; // Assuming the directory structure starts from the user's unique ID
                    File directory = new File(directoryPath);
                    if (directory.exists() && directory.isDirectory()) {
                        String[] fileNames = directory.list();
                        if (fileNames != null) {
                            // Create a JSON array to store file information
                            JSONArray filesArray = new JSONArray();

                            for (String fileName: fileNames) {
                                // Check if metadata.json exists and add its contents to the JSON array
                                String metadataFilePath = "upload/" + uid + "/" + fileName + "/metadata.json";
                                File metadataFile = new File(metadataFilePath);
                                if (metadataFile.exists() && metadataFile.isFile()) {
                                    // Read the contents of metadata.json
                                    try (FileReader fileReader = new FileReader(metadataFile)) {
                                        JSONParser parser = new JSONParser();
                                        JSONObject metadata = (JSONObject) parser.parse(fileReader);
                                        filesArray.add(metadata);
                                    }
                                }
                            }

                            ctx.json(filesArray);
                        } else {
                            ctx.result("No metadata files found in the directory."); // If no metadata files are found
                        }
                    } else {
                        ctx.result("Directory does not exist for the user."); // If the directory doesn't exist
                    }
                } catch (FirebaseAuthException | ParseException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );


        app.post(
            "/upload",
            ctx - > {
                try {
                    // The Firebase initialization is done outside the route handler

                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    Date date = new Date();
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH:mm");
                    String formattedDate = dateFormat.format(date);

                    String folderName = ctx.header("name").replace(" ", "_");

                    // Create a JSON object to store metadata
                    JSONObject metadata = new JSONObject();
                    metadata.put("uploadTime", formattedDate);
                    metadata.put("uploadName", ctx.header("name"));
                    metadata.put("datasetType", ctx.header("datasetType"));

                    File metadataDirectory = new File("upload/" + uid + "/" + folderName);
                    metadataDirectory.mkdirs();

                    String metadataFilePath = metadataDirectory.getPath() + "/metadata.json";

                    // Save the metadata to the JSON file
                    try (FileWriter file = new FileWriter(metadataFilePath)) {
                        file.write(metadata.toJSONString());
                        file.flush();
                    } catch (IOException e) {
                        e.printStackTrace();
                        // Sending an error response to the client
                        ctx.status(500).result("Error: Failed to save metadata on the server.");
                        return; // Exit the loop and return an error response
                    }

                    // Save each uploaded file with the folder name matching the upload name
                    for (UploadedFile uploadedFile: ctx.uploadedFiles("files")) {
                        String filePath = "upload/" + uid + "/" + folderName + "/" + uploadedFile.filename();
                        System.out.println(filePath);

                        File directory = new File(filePath).getParentFile();
                        if (!directory.exists()) {
                            directory.mkdirs(); // creates the directory including any necessary but nonexistent parent directories
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
                            // Sending an error response to the client
                            ctx.status(500).result("Error: Failed to save the file on the server.");
                            return; // Exit the loop and return an error response
                        }
                    }
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        app.post(
            "/newApiKey",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    JSONObject apiJsonObject;
                    try {
                        String content = Files.readString(Path.of("api.json"));
                        apiJsonObject = new JSONObject(content);
                    } catch (IOException e) {
                        e.printStackTrace();
                        apiJsonObject = new JSONObject();
                    }

                    if (apiJsonObject.has(uid)) {
                        String newApiKey = generateRandomApiKey();
                        apiJsonObject.put(uid, newApiKey);
                    } else {
                        String apiKey = generateRandomApiKey();
                        apiJsonObject.put(uid, apiKey);
                    }

                    try {
                        String jsonString = apiJsonObject.toString(2)
                        Files.write(Path.of("api.json"), jsonString.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        private static String generateRandomApiKey() {
            String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            StringBuilder apiKey = new StringBuilder();
            Random random = new Random();
            for (int i = 0; i < 12; i++) {
                apiKey.append(characters.charAt(random.nextInt(characters.length())));
            }
            return apiKey.toString();
        }

        app.post(
            "/getApiKey",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    JSONObject apiJsonObject;
                    try {
                        String content = Files.readString(Path.of("path/to/api.json"));
                        apiJsonObject = new JSONObject(content);
                    } catch (IOException e) {
                        e.printStackTrace();
                        ctx.status(500).result("Error: Unable to read API keys.");
                        return;
                    }

                    if (apiJsonObject.has(uid)) {
                        String apiKey = apiJsonObject.getString(uid);
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

    }
}