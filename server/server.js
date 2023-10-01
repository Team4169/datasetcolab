// npm install express multer cors https fs
// openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const port = 3433;

app.use(cors());

// Storage shit
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const date = new Date();
        const folderName = 'uploads/' + date.toISOString().slice(0, 10) + '_' + date.getHours() + ':' + date.getMinutes();

        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
        }

        cb(null, folderName + '/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array('files'), (req, res) => {
    res.status(200).send('Files uploaded');
});

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
    passphrase: 'warriorrobotics'
};

const server = https.createServer(httpsOptions, app);

server.listen(port, () => {
    console.log(`Server started on https://localhost:${port}`);
});
