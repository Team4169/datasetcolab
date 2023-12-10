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

import java.util.*;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.text.ParseException;  // Add this import statement
import java.util.HashSet;
import java.util.Set;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

public class Roboflow {

    private Utils utils = new Utils();
    public Set<String> classes = new HashSet<>();
    public ArrayList<Integer> classAmounts = new ArrayList();

    public String upload(String folderName, String roboflowUrl, String uid) {
        String apiKey = readApiKeyFromFile("roboflow.txt");

        String workspace = getWorkspaceFromUrl(roboflowUrl);
        String project = getProjectFromUrl(roboflowUrl);

        String apiUrl = "https://api.roboflow.com/" + workspace;
        String apiKeyParam = "?api_key=" + apiKey;

        String versionsJSONString = utils.executeCommand("curl https://api.roboflow.com/" + workspace + "/" + project + "?api_key=" + apiKey);
        String latestVersionId = parseLatestVersionId(versionsJSONString);
        String versionJSON = utils.executeCommand("curl https://api.roboflow.com/" + latestVersionId + "/coco?api_key=" + apiKey);
        String exportLink = parseExportLink(versionJSON);

        try {
            JSONParser parser = new JSONParser();
            JSONObject versionsJSON = (JSONObject) parser.parse(versionsJSONString);

            JSONObject projectJSON = (JSONObject) versionsJSON.get("project");
            JSONObject classesJSON = (JSONObject) projectJSON.get("classes");

            for (Object className : classesJSON.keySet()) {
                // System.out.println(classAmounts);
                classes.add((String) className);
                // classAmounts.add((Integer) className.get("size"))
            }

            return exportLink;
        } catch (org.json.simple.parser.ParseException e) {
            e.printStackTrace();
            return null;
        }
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
    }

    private String readApiKeyFromFile(String filePath) {
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            return reader.readLine().trim();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
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
}

