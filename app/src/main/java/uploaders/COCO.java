package uploaders;
import utils.Utils;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
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
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class COCO {

    private Utils utils = new Utils();
    public Set<String> parsedNames = new HashSet<>();

    public void upload(String folderName, List<UploadedFile> files, String uid) {
	    for (UploadedFile uploadedFile : files) {
            String filePath = "upload/" + uid + "/" + folderName + "/" + uploadedFile.filename();

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
            }

            if (uploadedFile.filename().toLowerCase().endsWith(".zip")) {
                unzip(filePath, directory.getPath());
            }

        }
    }

    public void postUpload(String uid, String folderName) {
	    parseFiles("upload/" + uid + "/" + folderName);
    }

    private void unzip(String zipFilePath, String destDirectory) {
        try (ZipInputStream zipInputStream = new ZipInputStream(new FileInputStream(zipFilePath))) {
            ZipEntry entry = zipInputStream.getNextEntry();

            while (entry != null) {
                String entryFilePath = destDirectory + File.separator + entry.getName();
                
                if (!entry.isDirectory()) {
                    File directory = new File(entryFilePath).getParentFile();
                    if (!directory.exists()) {
                        directory.mkdirs();
                    }
                    
                    try (OutputStream entryOutputStream = new FileOutputStream(entryFilePath)) {
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = zipInputStream.read(buffer)) != -1) {
                            entryOutputStream.write(buffer, 0, bytesRead);
                        }
                    }
                } else {
                    File dir = new File(entryFilePath);
                    dir.mkdirs();
                }

                zipInputStream.closeEntry();
                entry = zipInputStream.getNextEntry();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void parseFiles(String parentPath) {
        File parentFolder = new File(parentPath);

        if (parentFolder.exists() && parentFolder.isDirectory()) {
            parseFilesRecursive(parentFolder);
        } else {
            System.out.println("Invalid parent path or not a directory.");
        }
    }

    private void parseFilesRecursive(File folder) {
        File[] files = folder.listFiles();

        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    parseFilesRecursive(file);
                } else {
                    if (file.getName().toLowerCase().endsWith(".coco.json")) {
                        parseJsonFile(file);
                    }
                }
            }
        }
    }

    private void parseJsonFile(File jsonFile) {
        try (FileReader reader = new FileReader(jsonFile)) {
            JsonObject jsonObject = JsonParser.parseReader(reader).getAsJsonObject();
            String categoryName = jsonObject.getAsJsonArray("categories").get(0).getAsJsonObject().get("name").getAsString();

            if (!parsedNames.contains(categoryName)) {
                parsedNames.add(categoryName);
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
