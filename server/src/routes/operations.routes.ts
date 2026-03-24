import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, saveDatabase } from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/programs/:programId/operations', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT o.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
    FROM operations o LEFT JOIN users u ON u.id = o.assigned_to
    WHERE o.program_id = '${req.params.programId}'
    ORDER BY o.created_at DESC
  `);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  }));
});

router.post('/programs/:programId/operations', (req: Request, res: Response) => {
  const { name, description, building, floor, assigned_to, due_date } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });

  const db = getDb();
  const id = uuid();
  db.run(
    `INSERT INTO operations (id, program_id, name, description, building, floor, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.params.programId, name, description || null, building || null, floor || null, assigned_to || null, due_date || null]
  );
  saveDatabase();
  res.status(201).json({ id, program_id: req.params.programId, name, description, building, floor, status: 'a_faire', assigned_to, due_date });
});

router.get('/operations/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`SELECT * FROM operations WHERE id = '${req.params.id}'`);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Opération non trouvée' });
  }
  const cols = result[0].columns;
  const obj: any = {};
  cols.forEach((c, i) => obj[c] = result[0].values[0][i]);
  res.json(obj);
});

router.put('/operations/:id', (req: Request, res: Response) => {
  const { name, description, building, floor, status, assigned_to, due_date } = req.body;
  const db = getDb();
  db.run(
    `UPDATE operations SET name=?, description=?, building=?, floor=?, status=?, assigned_to=?, due_date=? WHERE id=?`,
    [name, description, building, floor, status, assigned_to, due_date, req.params.id]
  );
  saveDatabase();
  res.json({ success: true });
});

export default router;
