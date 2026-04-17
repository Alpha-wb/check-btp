import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { getDb, saveDatabase } from '../db/database';
import { authMiddleware } from '../middleware/auth';
import { uploadDoc } from '../middleware/upload';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: Request, res: Response) => {
  const { userId, role } = (req as any).user;
  const db = getDb();
  // Superadmin voit TOUS les programmes
  const query = role === 'superadmin'
    ? `SELECT DISTINCT p.* FROM programs p ORDER BY p.created_at DESC`
    : `SELECT DISTINCT p.* FROM programs p
       LEFT JOIN program_members pm ON pm.program_id = p.id
       WHERE p.created_by = '${userId}' OR pm.user_id = '${userId}'
       ORDER BY p.created_at DESC`;
  const result = db.exec(query);

  if (result.length === 0) return res.json([]);

  const cols = result[0].columns;
  const programs = result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
  res.json(programs);
});

router.post('/', (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const { name, address, city, description, start_date, end_date } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom du programme requis' });

  const db = getDb();
  const id = uuid();
  const memberId = uuid();

  db.run(
    `INSERT INTO programs (id, name, address, city, description, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, address || null, city || null, description || null, start_date || null, end_date || null, userId]
  );
  db.run(
    `INSERT INTO program_members (id, program_id, user_id, role) VALUES (?, ?, ?, 'admin')`,
    [memberId, id, userId]
  );
  saveDatabase();

  res.status(201).json({ id, name, address, city, description, start_date, end_date, status: 'actif', created_by: userId });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`SELECT * FROM programs WHERE id = '${req.params.id}'`);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Programme non trouvé' });
  }
  const cols = result[0].columns;
  const obj: any = {};
  cols.forEach((c, i) => obj[c] = result[0].values[0][i]);

  // Get members
  const members = db.exec(`
    SELECT pm.*, u.first_name, u.last_name, u.email, u.company
    FROM program_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.program_id = '${req.params.id}'
  `);
  obj.members = members.length > 0
    ? members[0].values.map(row => {
        const m: any = {};
        members[0].columns.forEach((c, i) => m[c] = row[i]);
        return m;
      })
    : [];

  res.json(obj);
});

router.put('/:id', (req: Request, res: Response) => {
  const { name, address, city, description, start_date, end_date, status } = req.body;
  const db = getDb();
  db.run(
    `UPDATE programs SET name=?, address=?, city=?, description=?, start_date=?, end_date=?, status=? WHERE id=?`,
    [name, address, city, description, start_date, end_date, status, req.params.id]
  );
  saveDatabase();
  res.json({ success: true });
});

router.post('/:id/members', (req: Request, res: Response) => {
  const { email, role } = req.body;
  const db = getDb();

  const userResult = db.exec(`SELECT id FROM users WHERE email = '${email?.replace(/'/g, "''")}'`);
  if (userResult.length === 0 || userResult[0].values.length === 0) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const userId = userResult[0].values[0][0] as string;
  const id = uuid();
  try {
    db.run(
      `INSERT INTO program_members (id, program_id, user_id, role) VALUES (?, ?, ?, ?)`,
      [id, req.params.id, userId, role || 'membre']
    );
    saveDatabase();
    res.status(201).json({ id, program_id: req.params.id, user_id: userId, role: role || 'membre' });
  } catch {
    res.status(409).json({ error: 'Membre déjà ajouté' });
  }
});

router.delete('/:id/members/:userId', (req: Request, res: Response) => {
  const db = getDb();
  db.run(`DELETE FROM program_members WHERE program_id = ? AND user_id = ?`, [req.params.id, req.params.userId]);
  saveDatabase();
  res.json({ success: true });
});

// ── Documents (CR, planning, plans, etc.) ──

router.post('/:id/documents', uploadDoc.array('files', 10), (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'Aucun fichier' });

  const db = getDb();
  const doc_type = (req.body.doc_type as string) || 'autre';
  const operation_id = (req.body.operation_id as string) || null;
  const docs: any[] = [];

  for (const file of files) {
    const id = uuid();
    db.run(
      `INSERT INTO documents (id, program_id, operation_id, doc_type, filename, original_name, path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, operation_id, doc_type, file.filename, file.originalname, file.path, userId]
    );
    docs.push({ id, program_id: req.params.id, operation_id, doc_type, filename: file.filename, original_name: file.originalname, uploaded_at: new Date().toISOString() });
  }
  saveDatabase();
  res.status(201).json(docs);
});

router.get('/:id/documents', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT d.*, u.first_name || ' ' || u.last_name as uploaded_by_name
    FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by
    WHERE d.program_id = '${req.params.id}'
    ORDER BY d.uploaded_at DESC
  `);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  }));
});

router.delete('/:id/documents/:docId', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`SELECT path FROM documents WHERE id = '${req.params.docId}' AND program_id = '${req.params.id}'`);
  if (result.length > 0 && result[0].values.length > 0) {
    const filePath = result[0].values[0][0] as string;
    try { fs.unlinkSync(filePath); } catch {}
  }
  db.run(`DELETE FROM documents WHERE id = ? AND program_id = ?`, [req.params.docId, req.params.id]);
  saveDatabase();
  res.json({ success: true });
});

export default router;
