import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, saveDatabase } from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ── Operations CRUD ──

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

// ── Suivi Incontournable (interactive checks) ──

router.get('/operations/:id/suivi', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT etape_id, item_id, checked, checked_by, checked_at
    FROM suivi_checks WHERE operation_id = '${req.params.id}'
  `);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  }));
});

router.put('/operations/:id/suivi', (req: Request, res: Response) => {
  const { etape_id, item_id, checked } = req.body;
  const { userId } = (req as any).user;
  if (!etape_id || !item_id) return res.status(400).json({ error: 'etape_id et item_id requis' });

  const db = getDb();
  const id = uuid();
  db.run(`
    INSERT INTO suivi_checks (id, operation_id, etape_id, item_id, checked, checked_by, checked_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(operation_id, etape_id, item_id)
    DO UPDATE SET checked = ?, checked_by = ?, checked_at = datetime('now')
  `, [id, req.params.id, etape_id, item_id, checked ? 1 : 0, userId, checked ? 1 : 0, userId]);
  saveDatabase();
  res.json({ success: true, etape_id, item_id, checked });
});

// ── Planning de référence ──

router.get('/operations/:id/planning', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT pr.*, c.status as fico_status, c.checked_at
    FROM planning_reference pr
    LEFT JOIN controls c ON c.operation_id = pr.operation_id AND c.fico_type = pr.fico_type
    WHERE pr.operation_id = '${req.params.id}'
    ORDER BY pr.planned_date ASC
  `);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  }));
});

router.put('/operations/:id/planning', (req: Request, res: Response) => {
  const { fico_type, planned_date, actual_date } = req.body;
  if (!fico_type || !planned_date) return res.status(400).json({ error: 'fico_type et planned_date requis' });

  const db = getDb();
  const id = uuid();
  db.run(`
    INSERT INTO planning_reference (id, operation_id, fico_type, planned_date, actual_date)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(operation_id, fico_type)
    DO UPDATE SET planned_date = ?, actual_date = ?
  `, [id, req.params.id, fico_type, planned_date, actual_date || null, planned_date, actual_date || null]);
  saveDatabase();
  res.json({ success: true });
});

// ── Alertes automatiques (FICO en retard vs planning) ──

router.get('/operations/:id/alerts', (req: Request, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // FICOs prévus mais pas encore faits (en_attente ou inexistants) et date dépassée
  const result = db.exec(`
    SELECT pr.fico_type, pr.planned_date, pr.actual_date,
           COALESCE(c.status, 'non_cree') as fico_status,
           CASE
             WHEN c.status IS NULL OR c.status = 'en_attente' THEN
               CASE
                 WHEN pr.planned_date < '${today}' THEN 'en_retard'
                 WHEN date(pr.planned_date, '-7 days') < '${today}' THEN 'imminent'
                 ELSE 'a_venir'
               END
             WHEN c.status = 'non_conforme' THEN 'non_conforme'
             ELSE 'ok'
           END as alert_level
    FROM planning_reference pr
    LEFT JOIN controls c ON c.operation_id = pr.operation_id AND c.fico_type = pr.fico_type
    WHERE pr.operation_id = '${req.params.id}'
    ORDER BY
      CASE
        WHEN c.status IS NULL OR c.status = 'en_attente' THEN
          CASE WHEN pr.planned_date < '${today}' THEN 0 ELSE 1 END
        WHEN c.status = 'non_conforme' THEN 2
        ELSE 3
      END,
      pr.planned_date ASC
  `);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  const alerts = result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  }).filter(a => a.alert_level !== 'ok');
  res.json(alerts);
});

// Alertes globales pour un programme (toutes opérations)
router.get('/programs/:programId/alerts', (req: Request, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const result = db.exec(`
    SELECT o.id as operation_id, o.name as operation_name, pr.fico_type, pr.planned_date,
           COALESCE(c.status, 'non_cree') as fico_status,
           CASE
             WHEN c.status IS NULL OR c.status = 'en_attente' THEN
               CASE
                 WHEN pr.planned_date < '${today}' THEN 'en_retard'
                 WHEN date(pr.planned_date, '-7 days') < '${today}' THEN 'imminent'
                 ELSE 'a_venir'
               END
             WHEN c.status = 'non_conforme' THEN 'non_conforme'
             ELSE 'ok'
           END as alert_level
    FROM planning_reference pr
    JOIN operations o ON o.id = pr.operation_id
    LEFT JOIN controls c ON c.operation_id = pr.operation_id AND c.fico_type = pr.fico_type
    WHERE o.program_id = '${req.params.programId}'
    AND (c.status IS NULL OR c.status IN ('en_attente', 'non_conforme'))
    ORDER BY pr.planned_date ASC
  `);
  if (result.length === 0) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  }).filter(a => a.alert_level !== 'ok'));
});

export default router;
