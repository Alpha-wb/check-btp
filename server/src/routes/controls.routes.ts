import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, saveDatabase } from '../db/database';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(authMiddleware);

router.get('/operations/:operationId/controls', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT c.*, u.first_name as checker_first_name, u.last_name as checker_last_name
    FROM controls c LEFT JOIN users u ON u.id = c.checked_by
    WHERE c.operation_id = '${req.params.operationId}'
    ORDER BY c.fico_type ASC
  `);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    if (obj.data) obj.data = JSON.parse(obj.data);
    return obj;
  }));
});

router.post('/operations/:operationId/controls', (req: Request, res: Response) => {
  const { fico_type, status, comments, data } = req.body;
  const { userId } = (req as any).user;
  if (!fico_type) return res.status(400).json({ error: 'Type FICO requis' });

  const db = getDb();
  const id = uuid();
  db.run(
    `INSERT INTO controls (id, operation_id, fico_type, status, checked_by, checked_at, comments, data) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?)`,
    [id, req.params.operationId, fico_type, status || 'en_attente', userId, comments || null, JSON.stringify(data || {})]
  );
  saveDatabase();
  res.status(201).json({ id, operation_id: req.params.operationId, fico_type, status: status || 'en_attente' });
});

router.get('/controls/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`SELECT * FROM controls WHERE id = '${req.params.id}'`);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Contrôle non trouvé' });
  }
  const cols = result[0].columns;
  const obj: any = {};
  cols.forEach((c, i) => obj[c] = result[0].values[0][i]);
  if (obj.data) obj.data = JSON.parse(obj.data);

  // Get photos
  const photos = db.exec(`SELECT * FROM control_photos WHERE control_id = '${req.params.id}'`);
  obj.photos = photos.length > 0
    ? photos[0].values.map(row => {
        const p: any = {};
        photos[0].columns.forEach((c, i) => p[c] = row[i]);
        return p;
      })
    : [];

  res.json(obj);
});

router.put('/controls/:id', (req: Request, res: Response) => {
  const { status, comments, data } = req.body;
  const { userId } = (req as any).user;
  const db = getDb();
  db.run(
    `UPDATE controls SET status=?, comments=?, data=?, checked_by=?, checked_at=datetime('now') WHERE id=?`,
    [status, comments, JSON.stringify(data || {}), userId, req.params.id]
  );
  saveDatabase();
  res.json({ success: true });
});

router.post('/controls/:id/photos', upload.array('photos', 10), (req: Request, res: Response) => {
  const db = getDb();
  const files = req.files as Express.Multer.File[];
  const inserted = files.map(f => {
    const id = uuid();
    db.run(
      `INSERT INTO control_photos (id, control_id, filename, original_name, path) VALUES (?, ?, ?, ?, ?)`,
      [id, req.params.id, f.filename, f.originalname, f.path]
    );
    return { id, filename: f.filename, original_name: f.originalname };
  });
  saveDatabase();
  res.status(201).json(inserted);
});

export default router;
