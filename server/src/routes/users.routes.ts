import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/notifications', (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const db = getDb();
  const result = db.exec(`SELECT * FROM notifications WHERE user_id = '${userId}' ORDER BY created_at DESC LIMIT 50`);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  }));
});

router.put('/notifications/:id/read', (req: Request, res: Response) => {
  const db = getDb();
  const { saveDatabase } = require('../db/database');
  db.run(`UPDATE notifications SET read = 1 WHERE id = ?`, [req.params.id]);
  saveDatabase();
  res.json({ success: true });
});

export default router;
