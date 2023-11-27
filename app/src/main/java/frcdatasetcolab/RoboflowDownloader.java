import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class RoboflowDownloader {

    public void downloadDataset(String roboflowUrl) {
        String apiKey = readApiKeyFromFile("roboflow.txt");

        String workspace = getWorkspaceFromUrl(roboflowUrl);
        String project = getProjectFromUrl(roboflowUrl);

        String projectsJson = executeCommand(
                "curl \"https://api.roboflow.com/" + workspace + "?api_key=" + apiKey + "\""
        );

        // Parse JSON and get the project ID
        String projectId = parseProjectId(projectsJson, project);

        String versionsJson = executeCommand(
                "curl \"https://api.roboflow.com/" + workspace + "/" + projectId + "?api_key=" + apiKey + "\""
        );

        // Parse JSON and get the latest version ID
        String latestVersionId = parseLatestVersionId(versionsJson);

        String versionJson = executeCommand(
                "curl \"https://api.roboflow.com/" + workspace + "/" + projectId + "/" + latestVersionId + "?api_key=" + apiKey + "\""
        );

        // Parse JSON and get the export link
        String exportLink = parseExportLink(versionJson);

        // Download dataset using wget and unzip
        executeCommand("wget -O upload//dataset.zip " + exportLink);
        executeCommand("unzip dataset.zip");
    }

    private String readApiKeyFromFile(String filePath) {
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            return reader.readLine().trim();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    private String executeCommand(String command) {
        StringBuilder output = new StringBuilder();

        try {
            Process process = Runtime.getRuntime().exec(command);
            process.waitFor();

            BufferedReader reader =
                    new BufferedReader(new InputStreamReader(process.getInputStream()));

            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }

        return output.toString();
    }

    private String parseLatestVersionId(String versionsJson) {
        JsonObject json = JsonParser.parseString(versionsJson).getAsJsonObject();
        JsonArray versionsArray = json.getAsJsonArray("versions");
        JsonObject latestVersion = versionsArray.get(0).getAsJsonObject(); // Assuming versions are ordered by creation time
        return latestVersion.get("id").getAsString();
    }

    private String parseExportLink(String versionJson) {
        JsonObject json = JsonParser.parseString(versionJson).getAsJsonObject();
        JsonObject export = json.getAsJsonObject("export");
        return export.get("link").getAsString();
    }

    private String parseProjectId(String projectsJson, String projectName) {
        JsonArray projectsArray = JsonParser.parseString(projectsJson).getAsJsonArray();
        for (int i = 0; i < projectsArray.size(); i++) {
            JsonObject project = projectsArray.get(i).getAsJsonObject();
            if (projectName.equals(project.get("name").getAsString())) {
                return project.get("id").getAsString();
            }
        }
        return null;
    }

    private String getWorkspaceFromUrl(String roboflowUrl) {
        String[] parts = roboflowUrl.split("/");
        return parts[parts.length - 2];
    }

    private String getProjectFromUrl(String roboflowUrl) {
        String[] parts = roboflowUrl.split("/");
        return parts[parts.length - 1];
    }
}
