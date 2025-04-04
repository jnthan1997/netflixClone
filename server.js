const express = require("express");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.static("public"));

//mongodb connection environment
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;

// MongoDB connection
const mongoURI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/videoDB?authSource=admin'`;
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let gfs;
let gridFSBucket;
conn.once("open", () => {
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: "videos" });
    gfs = conn.db.collection("videos.files");
});

// Fetch list of uploaded videos
app.get("/videos", async (req, res) => {
    try {
        if (!gfs) {
            return res.status(500).json({ error: "GridFS is not initialized" });
        }

        const files = await gfs.find().toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: "No videos found" });
        }

        res.json(files.map(file => ({ filename: file.filename, length: file.length })));    
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stream video by filename
app.get("/video/:filename", async (req, res) => {
    try {
        if (!gfs || !gridFSBucket) {
            return res.status(500).json({ error: "GridFS is not initialized" });
        }

        const files = await gfs.find({ filename: req.params.filename }).toArray();
        if (!files.length) {
            return res.status(404).json({ error: "File not found" });
        }

        const file = files[0];
        const fileSize = file.length;

        res.writeHead(200, {
            "Content-Type": "video/mp4",
            "Content-Length": fileSize
        });

        const readStream = gridFSBucket.openDownloadStreamByName(req.params.filename);
        readStream.pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve simple frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
