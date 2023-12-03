package uploaders;
import utils.Utils;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;;
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

public class Roboflow {

    private Utils utils = new Utils();
    public Set<String> parsedNames = new HashSet<>();

    public String upload(String folderName, String roboflowUrl, String uid) {
        String apiKey = readApiKeyFromFile("roboflow.txt");

        String workspace = getWorkspaceFromUrl(roboflowUrl);
        String project = getProjectFromUrl(roboflowUrl);

        String apiUrl = "https://api.roboflow.com/" + workspace;
        String apiKeyParam = "?api_key=" + apiKey;

        String versionsJson = utils.executeCommand("curl https://api.roboflow.com/" + workspace + "/" + project + "?api_key=" + apiKey);
        String latestVersionId = parseLatestVersionId(versionsJson);
        String versionJson = utils.executeCommand("curl https://api.roboflow.com/" + latestVersionId + "/coco?api_key=" + apiKey);
        String exportLink = parseExportLink(versionJson);

	return(exportLink);
    }

    public void postUpload(String uid, String folderName, String exportLink) {
 	utils.executeCommand("mkdir -p upload/" + uid + "/" + folderName);
        utils.executeCommand("wget --user-agent='Mozilla/5.0' -O upload/" + uid + "/" + folderName + "/dataset.zip " + exportLink);

        if (utils.getLastExitCode() == 0) {
            utils.executeCommand("unzip upload/" + uid + "/" + folderName + "/dataset.zip -d upload/" + uid + "/" + folderName);
            utils.executeCommand("rm upload/" + uid + "/" + folderName + "/dataset.zip");
        } else {
            System.err.println("Download failed. Skipping unzip.");
        }
        
        parseFiles("upload/" + uid + "/" + folderName);
    }

    private String readApiKeyFromFile(String filePath) {
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            return reader.readLine().trim();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    private String parseLatestVersionId(String versionsJson) {
        JsonObject json = JsonParser.parseString(versionsJson).getAsJsonObject();
        JsonArray versionsArray = json.getAsJsonArray("versions");
        JsonObject latestVersion = versionsArray.get(0).getAsJsonObject();
        return latestVersion.get("id").getAsString();
    }

    private String parseExportLink(String versionJson) {
        JsonObject json = JsonParser.parseString(versionJson).getAsJsonObject();
        JsonObject export = json.getAsJsonObject("export");
        return export.get("link").getAsString();
    }

    public String getWorkspaceFromUrl(String roboflowUrl) {
        String[] parts = roboflowUrl.split("/");
        return parts[parts.length - 2];
    }

    public String getProjectFromUrl(String roboflowUrl) {
        String[] parts = roboflowUrl.split("/");
        return parts[parts.length - 1];
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
