// npm install express multer cors
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3433;

app.use(cors());

// Storage shit
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array('files'), (req, res) => {
    res.status(200).send('Files uploaded');
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
