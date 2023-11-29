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
                            result.put(file.getName(), "File");
                        }
                    }
                }
            } else {
                result.put("error", "Invalid folder path or not a directory.");
            }
        }

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

        app.get(
            "/view/{folderName}",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    String folderName = ctx.pathParam("folderName");
                    String metadataFilePath = "upload/" + uid + "/" + folderName + "/metadata.json";
                    File metadataFile = new File(metadataFilePath);

                    if (metadataFile.exists() && metadataFile.isFile()) {
                        try (FileReader fileReader = new FileReader(metadataFile)) {
                            JSONParser parser = new JSONParser();
                            JSONObject metadata = (JSONObject) parser.parse(fileReader);
                            ctx.json(metadata);
                        }
                    } else {
                        ctx.result("Metadata file not found for the specified project.");
                    }
                } catch (FirebaseAuthException | ParseException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

        app.get(
            "/files/{folderName}",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    String folderName = ctx.pathParam("folderName");
                    String folderPath = "upload/" + uid + "/" + folderName;

                    JSONObject result = new JSONObject();
                    populateTree(folderPath, result);

                    ctx.json(result);
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

	app.post("/delete/{folderName}", ctx -> {
		try {
			FirebaseToken decodedToken = FirebaseAuth
				.getInstance()
				.verifyIdToken(ctx.header("idToken"));
			String uid = decodedToken.getUid();

			String folderName = ctx.pathParam("folderName");

			Utils utils = new Utils();
			utils.executeCommand("rm -fr upload/" + uid + "/" + folderName);
		} catch (FirebaseAuthException e) {
			e.printStackTrace();
			ctx.status(401).result("Error: Authentication failed.");
		}	
	}
	);
/*
    app.post("/edit/{folderName}", ctx -> {
		try {
			FirebaseToken decodedToken = FirebaseAuth
				.getInstance()
				.verifyIdToken(ctx.header("idToken"));
			String uid = decodedToken.getUid();

			String folderName = ctx.pathParam("folderName");
            JSONObject dataToAdd = new JSONObject(ctx.body());
            addToMetadata(folderName, dataToAdd);
			
		} catch (FirebaseAuthException e) {
			e.printStackTrace();
			ctx.status(401).result("Error: Authentication failed.");
		}	
	}
	);
*/
        app.get(
            "/upload",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

                    Date date = new Date();
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH:mm");

                    Utils utils = new Utils();

                    String uploadTime = dateFormat.format(date);
                    String uploadName = ctx.header("uploadName");
                    String folderName = utils.generateRandomString(8);
                    String datasetType = ctx.header("datasetType");
                    String targetDataset = ctx.header("targetDataset");
                    JSONArray parsedNamesUpload = new JSONArray();

                    JSONObject metadata = new JSONObject();

                    if (ctx.header("datasetType").equals("COCO")) {
                        COCO uploader = new COCO();
                        uploader.upload(folderName, ctx.uploadedFiles("files"), uid);
                        Set<String> parsedNames = uploader.parsedNames;
                        parsedNamesUpload.addAll(parsedNames);
                    } else if (ctx.header("datasetType").equals("ROBOFLOW")) {
                        Roboflow uploader = new Roboflow();
                        uploader.upload(folderName, ctx.header("roboflowUrl"), uid);
                        uploadName = uploader.getProjectFromUrl(ctx.header("roboflowUrl"));
                        datasetType = "COCO";
                        Set<String> parsedNames = uploader.parsedNames;
                        parsedNamesUpload.addAll(parsedNames);
                    }

                    metadata.put("uploadTime", uploadTime);
                    metadata.put("uploadName", uploadName);
                    metadata.put("datasetType", datasetType);
                    metadata.put("targetDataset", targetDataset);
                    metadata.put("folderName", folderName);
                    metadata.put("parsedNames", parsedNamesUpload);

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

                   
                    if (targetDataset.equals("FRC2023")) {
                        utils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2023/" + "test " + uid + "/" + folderName + "/test");
                        utils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2023/" + "train " + uid + "/" + folderName + "/train");
                        utils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2023/" + "valid " + uid + "/" + folderName + "/valid");
                    } else if (targetDataset.equals("FRC2024")) {
                        utils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2024/" + "test " + uid + "/" + folderName + "/test");
                        utils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2024/" + "train " + uid + "/" + folderName + "/train");
                        utils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2024/" + "valid " + uid + "/" + folderName + "/valid");
                    }

                    ctx.json(metadata);
                   
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );
	/*
	app.get(
    "/download/:targetDataset",
    ctx -> {
        try {
            FirebaseToken decodedToken = FirebaseAuth
                .getInstance()
                .verifyIdToken(ctx.header("idToken"));
            String uid = decodedToken.getUid();

            String targetDataset = ctx.pathParam("targetDataset");
            String folderPath = "upload/" + uid + "/";

            if (targetDataset.equals("FRC2023") || targetDataset.equals("FRC2024")) {
                String targetFolderPath = folderPath + targetDataset;
                File targetFolder = new File(targetFolderPath);

                if (targetFolder.exists() && targetFolder.isDirectory()) {
                    String zipFileName = targetDataset + "_projects.zip";
                    Utils utils = new Utils();
                    utils.zipDirectory(targetFolderPath, zipFileName);

                    ctx.result(zipFileName);
                    ctx.contentType("application/zip");
                    ctx.header("Content-Disposition", "attachment; filename=" + zipFileName);
                } else {
                    ctx.result("Error: Target dataset folder not found.");
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
*/
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

                    Utils utils = new Utils();

                    String newApiKey = utils.generateRandomString(24);
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
