package com.example.javaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@SpringBootApplication
public class JavaServerApplication {

    private final Path rootLocation = Paths.get("uploads");

    public static void main(String[] args) {
        SpringApplication.run(JavaServerApplication.class, args);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> handleFileUpload(@RequestParam("files") MultipartFile[] files) {
        String message;
        try {
            for (MultipartFile file : files) {
                saveUploadedFiles(file);
            }
            message = "Files uploaded";
            return ResponseEntity.ok().body(message);
        } catch (Exception e) {
            message = "Fail to upload files!";
            return ResponseEntity.badRequest().body(message);
        }
    }

    public void saveUploadedFiles(MultipartFile file) throws Exception {
        if (file.isEmpty()) {
            throw new Exception("Failed to store empty file " + file.getOriginalFilename());
        }

        LocalDateTime now = LocalDateTime.now();
        String folderName = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH:mm"));
        Path uploadDir = rootLocation.resolve(folderName);

        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        Path destinationFile = uploadDir.resolve(Paths.get(file.getOriginalFilename()))
                .normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(uploadDir.toAbsolutePath())) {
            throw new Exception("Cannot store file outside current directory.");
        }

        file.transferTo(destinationFile);
    }
}
