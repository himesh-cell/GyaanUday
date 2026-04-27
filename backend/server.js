const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const helmet = require("helmet");
const dotenv = require("dotenv");
const multer = require("multer");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const upload = multer({ dest: "uploads/" });

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});

app.post("/api/uploads", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file provided" });
  }
  return res.status(201).json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});
// Format index.html for readability
// Update frontend scripts structure
// Fix minor warnings in console
// Improve network page accessibility
// Clean up unused CSS rules
// Enhance server error logging
// Update dependency configurations
// Minor bug fixes and optimizations
// Format index.html for readability
// Update frontend scripts structure
// Fix minor warnings in console
// Improve network page accessibility
// Clean up unused CSS rules
// Enhance server error logging
// Update dependency configurations
