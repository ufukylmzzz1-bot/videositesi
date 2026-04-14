const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

const uploadDir = "/var/www/uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, safeName);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Dosya yok" });
  }

  res.json({
    url: `http://www.1tanga.com/uploads/${req.file.filename}`,
  });
});

app.listen(4000, "0.0.0.0", () => {
  console.log("Upload API running on port 4000");
});
