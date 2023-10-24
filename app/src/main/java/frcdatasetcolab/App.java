package frcdatasetcolab;

import io.javalin.Javalin;
import io.javalin.util.FileUtil;
import io.javalin.http.UploadedFile;
import io.javalin.http.staticfiles.Location;
import java.text.SimpleDateFormat;
import java.util.Date;
import io.javalin.community.ssl.SSLPlugin;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import java.io.File;
import java.io.FileUtil;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class App {
    public static void main(String[] args) {
        // Initialize Firebase outside of the route handler
        try {
            FileInputStream serviceAccount = new FileInputStream("/home/team4169/frcdatasetcolab/app/src/main/java/frcdatasetcolab/admin.json");
            FirebaseOptions options = new FirebaseOptions.Builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();
            FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            e.printStackTrace();
            return; // Exit if there's an error with the service account file
        }

        Javalin app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> {
                cors.add(corsConfig -> {
                    corsConfig.anyHost();
                });
            });
            config.plugins.register(new SSLPlugin(ssl -> {
                ssl.host = "10.0.0.142";
                ssl.insecurePort = 7070;
                ssl.securePort = 3433;
                ssl.pemFromPath("fullchain.pem", "privkey.pem");
            }));
        }).start();

	app.get("/files/:fileName", ctx -> {
    try {
        // The Firebase initialization is done outside the route handler

        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(ctx.header("idToken"));
        String uid = decodedToken.getUid();

        String fileName = ctx.pathParam("fileName");
        String filePath = "upload/" + uid + "/" + fileName;

        File file = new File(filePath);
        if (file.exists() && !file.isDirectory()) {
            ctx.contentType(FileUtil.detectFileType(file.getName())); // Set the appropriate content type
            ctx.result(file);
        } else {
            ctx.result("File not found.");
        }
    } catch (FirebaseAuthException e) {
        e.printStackTrace();
        ctx.status(401).result("Error: Authentication failed.");
    }
});

app.get("/files", ctx -> {
    try {
        // The Firebase initialization is done outside the route handler

        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(ctx.header("idToken"));
        String uid = decodedToken.getUid();

        String directoryPath = "upload/" + uid; // Assuming the directory structure starts from the user's unique ID
        File directory = new File(directoryPath);
        if (directory.exists() && directory.isDirectory()) {
            String[] fileNames = directory.list();
            if (fileNames != null) {
                for (String fileName : fileNames) {
                    ctx.result(fileName + "\n"); // Return each file name as a response
                }
            } else {
                ctx.result("No files found in the directory."); // If no files are found
            }
        } else {
            ctx.result("Directory does not exist for the user."); // If the directory doesn't exist
        }
    } catch (FirebaseAuthException e) {
        e.printStackTrace();
        ctx.status(401).result("Error: Authentication failed.");
    }
});

        app.post("/upload", ctx -> {
            try {
                // The Firebase initialization is done outside the route handler

                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(ctx.header("idToken"));
                String uid = decodedToken.getUid();

                Date date = new Date();
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH:mm");
                String formattedDate = dateFormat.format(date);

                // Save each uploaded file with original folder structure preserved
                for (UploadedFile uploadedFile : ctx.uploadedFiles("files")) {
                    String filePath = "upload/" + uid + "/" + formattedDate + "/" + ctx.header("name").replace(" ", "_") + "/" + uploadedFile.filename();
                    System.out.println(filePath);

		    File directory = new File(filePath).getParentFile();
    		    if (!directory.exists()) {
        		directory.mkdirs(); // creates the directory including any necessary but nonexistent parent directories
		    }


                    try (InputStream fileContent = uploadedFile.content();
                         OutputStream output = new FileOutputStream(filePath)) {
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
        });
    }
}
