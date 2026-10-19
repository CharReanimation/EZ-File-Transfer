console.log("[DEBUG] server.js started");

// Initialize the server
const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const os = require("os");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Define the public directory
const publicDir = path.resolve(__dirname, "..", "Public");

// Define the upload directory
const uploadDir = path.join(__dirname, "uploads");
const tempDir = path.join(uploadDir, ".temp");

// Create upload directories if they do not exist
fs.mkdirSync(tempDir, { recursive: true });

// Configure file uploads
const upload = multer({ dest: tempDir });

// Serve static files
app.use(express.static(publicDir));

// Serve the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"), (error) => {
    if (error) {
      console.error("Homepage error:", error);
      if (!res.headersSent) {
        res.status(500).send("Failed to load index.html");
      }
    }
  });
});

// Get Local IP Address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  const preferred = [];
  const fallback = [];

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (/wlan|wi-?fi/i.test(name)) {
          preferred.push(iface.address);
        } else {
          fallback.push(iface.address);
        }
      }
    }
  }

  if (preferred.length > 0) return preferred[0];
  if (fallback.length > 0) return fallback[0];

  return "127.0.0.1";
};

// Generate a filename that does not overwrite an existing file
function getUniqueFilename(originalName) {
  const extension = path.extname(originalName);
  const basename = path.basename(originalName, extension);

  let filename = originalName;
  let counter = 1;

  while (fs.existsSync(path.join(uploadDir, filename))) {
    filename = `${basename}_${counter}${extension}`;
    counter++;
  }

  return filename;
}

// Save the uploaded file without overwriting an existing file
function saveUploadedFile(tempPath, originalName, useOriginalFilename) {
  const extension = path.extname(originalName);

  // Random filenames are used by default
  if (!useOriginalFilename) {
    const randomName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const destination = path.join(uploadDir, randomName);

    try {
      // Hard-link creation fails if the destination already exists
      fs.linkSync(tempPath, destination);
      fs.unlinkSync(tempPath);

      return randomName;
    } catch (error) {
      if (error.code === "EEXIST") {
        return saveUploadedFile(tempPath, originalName, false);
      }

      throw error;
    }
  }

  // Original filename mode: add _1, _2, etc. when necessary
  let counter = 0;

  while (true) {
    const filename =
      counter === 0
        ? originalName
        : `${path.basename(originalName, extension)}_${counter}${extension}`;

    const destination = path.join(uploadDir, filename);

    try {
      // Hard-link creation prevents overwriting existing files
      fs.linkSync(tempPath, destination);
      fs.unlinkSync(tempPath);

      return filename;
    } catch (error) {
      if (error.code === "EEXIST") {
        counter++;
        continue;
      }

      throw error;
    }
  }
}

// File Upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded.",
    });
  }

  // Strip any client-supplied directory path
  const originalName = path.basename(req.file.originalname);
  const useOriginalFilename = req.body.useOriginalFilename === "true";

  try {
    const storedName = saveUploadedFile(
      req.file.path,
      originalName,
      useOriginalFilename,
    );

    res.json({
      message: "Upload Success",
      name: originalName,
      storedName,
      size: req.file.size,
    });
  } catch (error) {
    // Remove the temporary upload if saving fails
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Upload error:", error);

    res.status(500).json({
      error: "Failed to save uploaded file.",
    });
  }
});

// File List
app.get("/files", (req, res) => {
  try {
    const files = fs
      .readdirSync(uploadDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    res.json(files);
  } catch (error) {
    console.error("File list error:", error);

    res.status(500).json({
      error: "Failed to list files.",
    });
  }
});

// File Download
app.get("/download/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  // Download
  res.download(filePath, filename, (error) => {
    if (error && !res.headersSent) {
      res.status(error.statusCode === 404 ? 404 : 500).json({
        error: "Failed to download file.",
      });
    }
  });
});

// Access URL
const server = app.listen(PORT, () => {
  console.log("[DEBUG] Server is listening");
  console.log(`Access URL: http://${getLocalIP()}:${PORT}`);
});

server.on("error", (error) => {
  console.error("[DEBUG] Server startup failed:", error);
});