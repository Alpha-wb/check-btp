import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, saveDatabase } from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── GET all board data for a program ───
router.get('/programs/:programId/board', (req: Request, res: Response) => {
  const db = getDb();
  const { programId } = req.params;

  // Get all section data
  const result = db.exec(`SELECT section, data FROM board_data WHERE program_id = '${programId}'`);
  const boardData: Record<string, any> = {};
  if (result.length > 0) {
    result[0].values.forEach(row => {
      try {
        boardData[row[0] as string] = JSON.parse(row[1] as string);
      } catch {
        boardData[row[0] as string] = {};
      }
    });
  }

  // Get custom sections
  const sectionsResult = db.exec(`SELECT * FROM board_sections WHERE program_id = '${programId}' ORDER BY section_order`);
  const customSections: any[] = [];
  if (sectionsResult.length > 0) {
    const cols = sectionsResult[0].columns;
    sectionsResult[0].values.forEach(row => {
      const obj: any = {};
      cols.forEach((c, i) => obj[c] = row[i]);
      try { obj.items = JSON.parse(obj.items); } catch { obj.items = []; }
      customSections.push(obj);
    });
  }

  res.json({ boardData, customSections });
});

// ─── PUT update a specific board section ───
router.put('/programs/:programId/board/:section', (req: Request, res: Response) => {
  const db = getDb();
  const { programId, section } = req.params;
  const { data } = req.body;

  if (!data) return res.status(400).json({ error: 'Data requis' });

  const dataStr = JSON.stringify(data);
  const id = uuid();

  // Upsert
  const existing = db.exec(`SELECT id FROM board_data WHERE program_id = '${programId}' AND section = '${section}'`);
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(`UPDATE board_data SET data = ?, updated_at = datetime('now') WHERE program_id = ? AND section = ?`,
      [dataStr, programId, section]);
  } else {
    db.run(`INSERT INTO board_data (id, program_id, section, data) VALUES (?, ?, ?, ?)`,
      [id, programId, section, dataStr]);
  }
  saveDatabase();
  res.json({ success: true });
});

// ─── POST create a custom section ───
router.post('/programs/:programId/board/sections', (req: Request, res: Response) => {
  const db = getDb();
  const { programId } = req.params;
  const { title, items } = req.body;

  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuid();
  // Get max order
  const maxOrder = db.exec(`SELECT COALESCE(MAX(section_order), 0) FROM board_sections WHERE program_id = '${programId}'`);
  const order = maxOrder.length > 0 ? (maxOrder[0].values[0][0] as number) + 1 : 0;

  db.run(`INSERT INTO board_sections (id, program_id, title, section_order, items) VALUES (?, ?, ?, ?, ?)`,
    [id, programId, title, order, JSON.stringify(items || [])]);
  saveDatabase();

  res.status(201).json({ id, program_id: programId, title, section_order: order, items: items || [] });
});

// ─── PUT update a custom section ───
router.put('/programs/:programId/board/sections/:sectionId', (req: Request, res: Response) => {
  const db = getDb();
  const { sectionId } = req.params;
  const { title, items } = req.body;

  db.run(`UPDATE board_sections SET title = ?, items = ? WHERE id = ?`,
    [title, JSON.stringify(items || []), sectionId]);
  saveDatabase();
  res.json({ success: true });
});

// ─── DELETE a custom section ───
router.delete('/programs/:programId/board/sections/:sectionId', (req: Request, res: Response) => {
  const db = getDb();
  const { sectionId } = req.params;

  db.run(`DELETE FROM board_sections WHERE id = ?`, [sectionId]);
  saveDatabase();
  res.json({ success: true });
});

export default router;
