package frcdatasetcolab;

import io.javalin.Javalin;
import io.javalin.util.FileUtil;
import io.javalin.http.UploadedFile;
import java.text.SimpleDateFormat;
import java.util.Date;
import io.javalin.community.ssl.SSLPlugin;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import java.io.FileInputStream;
import java.io.IOException;

public class App {
    public static void main(String[] args) {
	Javalin app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> {
                cors.add(corsConfig -> {
                    corsConfig.anyHost();
                });
            });
	    config.plugins.register(new SSLPlugin(ssl->{
	    ssl.host = "10.0.0.142";
	    ssl.insecurePort=7070;
	    ssl.securePort=3433;
            ssl.pemFromPath("fullchain.pem", "privkey.pem");
    }));
        })
            .get("/", ctx -> ctx.result("Hello World"))
            .start();
        
        app.post("/upload", ctx -> {
            try {
                FileInputStream serviceAccount = new FileInputStream("/home/team4169/frcdatasetcolab/app/src/main/java/frcdatasetcolab/admin.json");
                FirebaseOptions options = new FirebaseOptions.Builder().setCredentials(GoogleCredentials.fromStream(serviceAccount)).build();
                FirebaseApp.initializeApp(options);

                try {
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(ctx.header("idToken"));
                    String uid = decodedToken.getUid();
                    
                    Date date = new Date();
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH:mm");
                    String formattedDate = dateFormat.format(date);
                    ctx.uploadedFiles("files").forEach(uploadedFile -> FileUtil.streamToFile(uploadedFile.content(), "upload/" + formattedDate + '_' + uploadedFile.filename()));
                } catch (FirebaseAuthException e) {
                    e.printStackTrace();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }
    
}
