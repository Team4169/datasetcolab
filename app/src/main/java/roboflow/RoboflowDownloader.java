package roboflow;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class RoboflowDownloader {

    private int lastExitCode = 0;

    public String downloadDataset(String roboflowUrl, String uid) {
        String apiKey = readApiKeyFromFile("roboflow.txt");

        String workspace = getWorkspaceFromUrl(roboflowUrl);
        String project = getProjectFromUrl(roboflowUrl);

        String apiUrl = "https://api.roboflow.com/" + workspace;
        String apiKeyParam = "?api_key=" + apiKey;

        String versionsJson = executeCommand("curl https://api.roboflow.com/" + workspace + "/" + project + "?api_key=" + apiKey);
        String latestVersionId = parseLatestVersionId(versionsJson);
        String versionJson = executeCommand("curl https://api.roboflow.com/" + latestVersionId + "/coco?api_key=" + apiKey);
        String exportLink = parseExportLink(versionJson);

        executeCommand("mkdir -p upload/" + uid + "/" + project);
        executeCommand("wget --user-agent='Mozilla/5.0' --referer=" + roboflowUrl + " -O upload/" + uid + "/" + project + "/dataset.zip " + exportLink);

        if (getLastExitCode() == 0) {
            executeCommand("unzip upload/" + uid + "/" + project + "/dataset.zip -d upload/" + uid + "/" + project);
            executeCommand("rm upload/" + uid + "/" + project + "/dataset.zip");
        } else {
            System.err.println("Download failed. Skipping unzip.");
        }

        return project;
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
    System.out.println(command);
    StringBuilder output = new StringBuilder();
    StringBuilder errorOutput = new StringBuilder();

    try {
        Process proc = Runtime.getRuntime().exec(command);

        Thread outputThread = new Thread(() -> {
            try (BufferedReader stdInput = new BufferedReader(new InputStreamReader(proc.getInputStream()))) {
                String s;
                while ((s = stdInput.readLine()) != null) {
                    output.append(s).append("\n");
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

        Thread errorThread = new Thread(() -> {
            try (BufferedReader stdError = new BufferedReader(new InputStreamReader(proc.getErrorStream()))) {
                String s;
                while ((s = stdError.readLine()) != null) {
                    errorOutput.append(s).append("\n");
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

        outputThread.start();
        errorThread.start();

        proc.waitFor();
        outputThread.join();
        errorThread.join();

        lastExitCode = proc.exitValue();
        if (lastExitCode != 0) {
            System.err.println("Command exited with non-zero status: " + lastExitCode);
            System.err.println("Error output:\n" + errorOutput.toString());
        }

    } catch (IOException | InterruptedException e) {
        e.printStackTrace();
        System.err.println(e);
    }

    return output.toString();
}


    private int getLastExitCode() {
        return lastExitCode;
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

    private String getWorkspaceFromUrl(String roboflowUrl) {
        String[] parts = roboflowUrl.split("/");
        return parts[parts.length - 2];
    }

    private String getProjectFromUrl(String roboflowUrl) {
        String[] parts = roboflowUrl.split("/");
        return parts[parts.length - 1];
    }
}
