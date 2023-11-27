package utils;

import java.io.*;
import java.util.*;

public class RandomString {

    public String generateRandomString(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder apiKey = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            apiKey.append(characters.charAt(random.nextInt(characters.length())));
        }
        return apiKey.toString();
    }
}
