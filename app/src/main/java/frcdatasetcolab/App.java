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
                        // Recursive call for subfolders
                        JSONObject subFolder = new JSONObject();
                        result.put(file.getName(), subFolder);
                        populateTree(file.getPath(), subFolder);
                    } else {
                        // Check if the file is an image
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
        return fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png")
                || fileName.endsWith(".gif") || fileName.endsWith(".bmp") || fileName.endsWith(".webp");
        // Add more image file extensions if needed
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

app.get("/view/<folderName>", ctx -> {
    try {
        FirebaseToken decodedToken = FirebaseAuth
            .getInstance()
            .verifyIdToken(ctx.header("idToken"));
        String uid = decodedToken.getUid();

        String folderName = ctx.pathParam("folderName");
        String requestedFile = "upload/" + uid + "/" + folderName;

        // Check if the requested path ends with an image extension
        if (requestedFile.matches(".*\\.(jpg|jpeg|png|webp)$")) {
            System.out.println(requestedFile);
            File imageFile = new File(requestedFile);

            if (imageFile.exists() && imageFile.isFile()) {
		System.out.println("hi");
                try (InputStream inputStream = new FileInputStream(imageFile)) {
                    ctx.result(inputStream);
                    ctx.contentType("image/*");
                }
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
	}
	);
/*
    app.get("/edit/{folderName}", ctx -> {
		try {
			FirebaseToken decodedToken = FirebaseAuth
				.getInstance()
				.verifyIdToken(ctx.header("idToken"));
			String uid = decodedToken.getUid();

			String folderName = ctx.pathParam("folderName");
            JSONObject dataToAdd = new JSONObject(ctx.body());
           // addToMetadata(folderName, dataToAdd);
	   
			
		} catch (FirebaseAuthException e) {
			e.printStackTrace();
			ctx.status(401).result("Error: Authentication failed.");
		}	
	}
	);
*/
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

                    String uploadTime = dateFormat.format(date);
                    String uploadName = ctx.header("uploadName");
                    String folderName = mainUtils.generateRandomString(8);
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
                        mainUtils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2023/" + "test " + uid + "/" + folderName + "/test");
                        mainUtils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2023/" + "train " + uid + "/" + folderName + "/train");
                        mainUtils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2023/" + "valid " + uid + "/" + folderName + "/valid");
                    } else if (targetDataset.equals("FRC2024")) {
                        mainUtils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2024/" + "test " + uid + "/" + folderName + "/test");
                        mainUtils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2024/" + "train " + uid + "/" + folderName + "/train");
                        mainUtils.executeCommand("python3 /home/team4169/frcdatasetcolab/app/combineDatasets.py FRC2024/" + "valid " + uid + "/" + folderName + "/valid");
                    }

                    ctx.json(metadata);
                   
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                    ctx.status(401).result("Error: Authentication failed.");
                }
            }
        );

	app.get(
    "/download/{targetDataset}",
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
                    mainUtils.zipDirectory(targetFolderPath, zipFileName);
		    
		    System.out.println(zipFileName);
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

        app.get(
            "/api",
            ctx -> {
                try {
                    FirebaseToken decodedToken = FirebaseAuth
                        .getInstance()
                        .verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();

		    String newKeyString = ctx.header("new");
		    boolean newKey;
		    if (newKeyString.equals("true")) {
		    	newKey = true;
		    } else {
			newKey = false;
		    }

                    JSONObject apiJsonObject;
                    try {
                        String content = Files.readString(Path.of("api.json"));
                        apiJsonObject = new JSONObject((Map<?, ?>) new JSONParser().parse(content));
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
	    "/test",
    	ctx -> ctx.status(200)
);

    }
}
