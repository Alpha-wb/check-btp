import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

// Chemin uploads : variable d'env (Fly.io /data) ou dossier local par défaut
const UPLOADS_BASE = process.env.UPLOADS_PATH || path.join(__dirname, '..', '..', 'uploads');
const DOCS_PATH = path.join(UPLOADS_BASE, 'documents');

// Créer les dossiers s'ils n'existent pas
[UPLOADS_BASE, DOCS_PATH].forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination: UPLOADS_BASE,
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
  destination: DOCS_PATH,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

export const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Filtre strict : seuls les fichiers documents légitimes
    const allowed = /\.(pdf|xlsx|xls|docx|doc|jpeg|jpg|png|webp|dwg|zip|csv|txt)$/i;
    cb(null, allowed.test(file.originalname));
  }
});
