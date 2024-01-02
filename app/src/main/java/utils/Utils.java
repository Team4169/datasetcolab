package utils;

import java.io.*;
import java.util.*;
import java.nio.file.*;
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
import java.text.SimpleDateFormat;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.json.simple.JSONArray;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.zip.ZipOutputStream;
import java.util.zip.ZipEntry;

public class Utils {

    private int lastExitCode = 0;
    
    public String generateRandomString(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder apiKey = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            apiKey.append(characters.charAt(random.nextInt(characters.length())));
        }
        return apiKey.toString();
    }

    
    public String executeCommand(String command) {
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

        /*
        System.out.println(output);
        System.out.println(errorOutput);
        */
        return output.toString();
    }

    public static void zipDirectory(String sourcePath, String zipFileName) throws IOException {
        Path sourcePathObj = Paths.get(sourcePath);
        try (ZipOutputStream zipOut = new ZipOutputStream(new FileOutputStream(zipFileName))) {
            Files.walk(sourcePathObj)
                .filter(path -> !Files.isDirectory(path))
                .forEach(path -> {
                    try {
                        String relativePath = sourcePathObj.relativize(path).toString();
                        zipOut.putNextEntry(new ZipEntry(relativePath));
                        Files.copy(path, zipOut);
                        zipOut.closeEntry();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });
        } catch (IOException e) {
            e.printStackTrace();
            throw new IOException("Error zipping directory: " + e.getMessage());
        }
    }

    public int getLastExitCode() {
        return lastExitCode;
    }

    public HashSet<String> parseFiles(String parentPath) {
        HashSet<String> parsedNames = new HashSet<>();
        File parentFolder = new File(parentPath);

        if (parentFolder.exists() && parentFolder.isDirectory()) {
            parseFilesRecursive(parentFolder, parsedNames);
        } else {
            System.out.println("Invalid parent path or not a directory.");
        }

        return parsedNames;
    }

    private void parseFilesRecursive(File folder, HashSet<String> parsedNames) {
        File[] files = folder.listFiles();

        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    parseFilesRecursive(file, parsedNames);
                } else {
                    if (file.getName().toLowerCase().endsWith(".json")) {
                        parseJsonFile(file, parsedNames);
                    }
                }
            }
        }
    }

    private void parseJsonFile(File jsonFile, HashSet<String> parsedNames) {
        try (FileReader reader = new FileReader(jsonFile)) {
            JsonObject jsonObject = JsonParser.parseReader(reader).getAsJsonObject();
            JsonArray categories = jsonObject.getAsJsonArray("categories");

            if (categories != null && categories.size() > 0) {
                for (int i = 0; i < categories.size(); i++) {
                    JsonObject firstCategory = categories.get(i).getAsJsonObject();
                    String categoryName = firstCategory.get("name").getAsString();
                    parsedNames.add(categoryName);
                }
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
