package utils;

import java.io.*;
import java.util.*;
import java.nio.file.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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


}
