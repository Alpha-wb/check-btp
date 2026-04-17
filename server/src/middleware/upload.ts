import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  }
});

// Upload pour documents (PDF, Excel, images, etc.)
const docStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'documents'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

export const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|xlsx|xls|docx|doc|jpeg|jpg|png|dwg|zip|csv/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ext || true);
  }
});
