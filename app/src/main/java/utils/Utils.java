package utils;

import java.io.*;
import java.util.*;

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

        return output.toString();
    }


    public int getLastExitCode() {
        return lastExitCode;
    }
}