package uploaders;
import utils.Utils;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Roboflow {

    private Utils utils = new Utils();

    public void upload(String folderName, String roboflowUrl, String uid) {
        String apiKey = readApiKeyFromFile("roboflow.txt");

        String workspace = getWorkspaceFromUrl(roboflowUrl);
        String project = getProjectFromUrl(roboflowUrl);

        String apiUrl = "https://api.roboflow.com/" + workspace;
        String apiKeyParam = "?api_key=" + apiKey;

        String versionsJson = utils.executeCommand("curl https://api.roboflow.com/" + workspace + "/" + project + "?api_key=" + apiKey);
        String latestVersionId = parseLatestVersionId(versionsJson);
        String versionJson = utils.executeCommand("curl https://api.roboflow.com/" + latestVersionId + "/coco?api_key=" + apiKey);
        String exportLink = parseExportLink(versionJson);

        utils.executeCommand("mkdir -p upload/" + uid + "/" + folderName);
        utils.executeCommand("wget --user-agent='Mozilla/5.0' --referer=" + roboflowUrl + " -O upload/" + uid + "/" + folderName + "/dataset.zip " + exportLink);

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
}
