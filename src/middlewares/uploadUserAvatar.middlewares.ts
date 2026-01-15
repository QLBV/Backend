import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const uploadDir = path.join("uploads", "avatars");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `user_${unique}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  cb(null, allowed.includes(file.mimetype));
};

export const uploadUserAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
