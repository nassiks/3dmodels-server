require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const router = require("./router/index");
const errorMiddleware = require("./middlewares/error-middleware");
const authMiddleware = require("./middlewares/auth-middleware");

const PORT = process.env.PORT || 5000;
const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cookieParser());
app.options("*", cors());

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const dir = "uploads/image";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", authMiddleware, upload.single("image"), (req, res) => {
  console.log(`File uploaded: ${req.file.path}`);
  res.json({
    url: `/uploads/image/${req.file.originalname}`,
  });
});

let modelName = "default_model_name";

const extractModelName = (req, res, next) => {
  if (req.body.modelFileName) {
    modelName = req.body.modelFileName.split(".")[0];
  } else {
    modelName = "default_model_name";
  }
  next();
};

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads/models", modelName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploadModel = multer({ storage: modelStorage });

app.post("/upload/modelname", authMiddleware, (req, res) => {
  if (req.body.modelFileName) {
    modelName = req.body.modelFileName.split(".")[0];
  } else {
    modelName = "default_model_name";
  }
  res.json({ modelName });
});

app.post(
  "/upload/model",
  authMiddleware,
  uploadModel.fields([
    { name: "model", maxCount: 1 },
    { name: "texture", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const modelFile = req.files["model"] ? req.files["model"][0] : null;
      const textureFile = req.files["texture"] ? req.files["texture"][0] : null;

      if (!modelFile) {
        return res.status(400).json({ error: "Model file is required" });
      }

      console.log(`Model uploaded: ${modelFile.path}`);
      if (textureFile) {
        console.log(`Texture uploaded: ${textureFile.path}`);
      }

      res.json({
        modelUrl: `/uploads/models/${modelName}/${modelFile.originalname}`,
        textureUrl: textureFile
          ? `/uploads/models/${modelName}/${textureFile.originalname}`
          : null,
      });
    } catch (error) {
      console.error("Error uploading model:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.use("/api", router);
app.use(errorMiddleware);

const start = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`));
  } catch (e) {
    console.log(e);
  }
};

start();
