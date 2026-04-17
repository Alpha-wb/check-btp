import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb, saveDatabase } from '../db/database';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(superAdminMiddleware);

// ════════════════════════════════════════════
//  GESTION DES UTILISATEURS
// ════════════════════════════════════════════

// GET all users
router.get('/users', (_req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT id, email, first_name, last_name, role, company, phone, created_at
    FROM users ORDER BY created_at DESC
  `);

  if (result.length === 0) return res.json([]);

  const cols = result[0].columns;
  const users = result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
  res.json(users);
});

// GET single user
router.get('/users/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT id, email, first_name, last_name, role, company, phone, created_at
    FROM users WHERE id = '${req.params.id}'
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const cols = result[0].columns;
  const obj: any = {};
  cols.forEach((c, i) => obj[c] = result[0].values[0][i]);

  // Get programs where user is member
  const programs = db.exec(`
    SELECT p.id, p.name, p.status, pm.role as member_role
    FROM programs p
    JOIN program_members pm ON pm.program_id = p.id
    WHERE pm.user_id = '${req.params.id}'
  `);

  obj.programs = [];
  if (programs.length > 0) {
    const pcols = programs[0].columns;
    obj.programs = programs[0].values.map(row => {
      const p: any = {};
      pcols.forEach((c, i) => p[c] = row[i]);
      return p;
    });
  }

  res.json(obj);
});

// POST create user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, role, company, phone } = req.body;
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Champs obligatoires: email, password, first_name, last_name, role' });
    }

    const db = getDb();
    const existing = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const id = uuid();
    const password_hash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, company, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, email, password_hash, first_name, last_name, role, company || null, phone || null]
    );
    saveDatabase();

    res.status(201).json({ id, email, first_name, last_name, role, company, phone });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { email, first_name, last_name, role, company, phone, password } = req.body;
    const db = getDb();

    // Check user exists
    const existing = db.exec(`SELECT id FROM users WHERE id = '${req.params.id}'`);
    if (existing.length === 0 || existing[0].values.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Check email uniqueness if changed
    if (email) {
      const emailCheck = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}' AND id != '${req.params.id}'`);
      if (emailCheck.length > 0 && emailCheck[0].values.length > 0) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre compte' });
      }
    }

    // Update password if provided
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [password_hash, req.params.id]);
    }

    db.run(
      `UPDATE users SET email = ?, first_name = ?, last_name = ?, role = ?, company = ?, phone = ? WHERE id = ?`,
      [email, first_name, last_name, role, company || null, phone || null, req.params.id]
    );
    saveDatabase();

    res.json({ success: true, id: req.params.id, email, first_name, last_name, role, company, phone });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST assign programs to user (bulk)
router.post('/users/:id/assign-programs', (req: Request, res: Response) => {
  const { program_ids, role } = req.body;
  if (!program_ids || !Array.isArray(program_ids)) {
    return res.status(400).json({ error: 'program_ids (array) requis' });
  }

  const db = getDb();
  const userId = req.params.id;
  const memberRole = role || 'membre';

  let added = 0;
  for (const programId of program_ids) {
    // Check not already member
    const existing = db.exec(`SELECT id FROM program_members WHERE program_id = '${programId}' AND user_id = '${userId}'`);
    if (existing.length === 0 || existing[0].values.length === 0) {
      db.run(`INSERT INTO program_members (id, program_id, user_id, role) VALUES (?, ?, ?, ?)`,
        [uuid(), programId, userId, memberRole]);
      added++;
    }
  }
  saveDatabase();
  res.json({ success: true, added });
});

// DELETE remove a program assignment from user
router.delete('/users/:userId/programs/:programId', (req: Request, res: Response) => {
  const db = getDb();
  db.run(`DELETE FROM program_members WHERE user_id = ? AND program_id = ?`,
    [req.params.userId, req.params.programId]);
  saveDatabase();
  res.json({ success: true });
});

// PUT update member role for a user in a program
router.put('/users/:userId/programs/:programId', (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'role requis' });

  const db = getDb();
  db.run(`UPDATE program_members SET role = ? WHERE user_id = ? AND program_id = ?`,
    [role, req.params.userId, req.params.programId]);
  saveDatabase();
  res.json({ success: true });
});

// DELETE user
router.delete('/users/:id', (req: Request, res: Response) => {
  const { userId } = (req as any).user;

  // Prevent self-deletion
  if (req.params.id === userId) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  }

  const db = getDb();

  // Check user exists
  const existing = db.exec(`SELECT id, role FROM users WHERE id = '${req.params.id}'`);
  if (existing.length === 0 || existing[0].values.length === 0) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  // Remove from program members first
  db.run(`DELETE FROM program_members WHERE user_id = ?`, [req.params.id]);
  db.run(`DELETE FROM notifications WHERE user_id = ?`, [req.params.id]);
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id]);
  saveDatabase();

  res.json({ success: true });
});

// ════════════════════════════════════════════
//  GESTION DES PROGRAMMES (DOSSIERS)
// ════════════════════════════════════════════

// GET all programs with stats
router.get('/programs', (_req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT p.*,
      u.first_name || ' ' || u.last_name as created_by_name,
      (SELECT COUNT(*) FROM operations o WHERE o.program_id = p.id) as operations_count,
      (SELECT COUNT(*) FROM program_members pm WHERE pm.program_id = p.id) as members_count
    FROM programs p
    LEFT JOIN users u ON u.id = p.created_by
    ORDER BY p.created_at DESC
  `);

  if (result.length === 0) return res.json([]);

  const cols = result[0].columns;
  const programs = result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
  res.json(programs);
});

// GET single program with full details
router.get('/programs/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec(`
    SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name
    FROM programs p
    LEFT JOIN users u ON u.id = p.created_by
    WHERE p.id = '${req.params.id}'
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Programme non trouvé' });
  }

  const cols = result[0].columns;
  const obj: any = {};
  cols.forEach((c, i) => obj[c] = result[0].values[0][i]);

  // Get members
  const members = db.exec(`
    SELECT pm.id as member_id, pm.role as member_role, pm.added_at,
           u.id, u.email, u.first_name, u.last_name, u.role, u.company
    FROM program_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.program_id = '${req.params.id}'
  `);

  obj.members = [];
  if (members.length > 0) {
    const mcols = members[0].columns;
    obj.members = members[0].values.map(row => {
      const m: any = {};
      mcols.forEach((c, i) => m[c] = row[i]);
      return m;
    });
  }

  // Get operations
  const ops = db.exec(`
    SELECT o.*, u.first_name || ' ' || u.last_name as assigned_name
    FROM operations o
    LEFT JOIN users u ON u.id = o.assigned_to
    WHERE o.program_id = '${req.params.id}'
  `);

  obj.operations = [];
  if (ops.length > 0) {
    const ocols = ops[0].columns;
    obj.operations = ops[0].values.map(row => {
      const o: any = {};
      ocols.forEach((c, i) => o[c] = row[i]);
      return o;
    });
  }

  res.json(obj);
});

// POST create program
router.post('/programs', (req: Request, res: Response) => {
  const { name, address, city, description, start_date, end_date, status, created_by } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom du programme requis' });

  const db = getDb();
  const id = uuid();
  const owner = created_by || (req as any).user.userId;

  db.run(
    `INSERT INTO programs (id, name, address, city, description, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, address || null, city || null, description || null, start_date || null, end_date || null, status || 'actif', owner]
  );

  // Auto-add creator as admin member
  db.run(`INSERT INTO program_members (id, program_id, user_id, role) VALUES (?, ?, ?, 'admin')`,
    [uuid(), id, owner]);

  saveDatabase();
  res.status(201).json({ id, name, status: status || 'actif' });
});

// PUT update program
router.put('/programs/:id', (req: Request, res: Response) => {
  const { name, address, city, description, start_date, end_date, status } = req.body;
  const db = getDb();

  db.run(
    `UPDATE programs SET name=?, address=?, city=?, description=?, start_date=?, end_date=?, status=? WHERE id=?`,
    [name, address || null, city || null, description || null, start_date || null, end_date || null, status || 'actif', req.params.id]
  );
  saveDatabase();
  res.json({ success: true });
});

// DELETE program
router.delete('/programs/:id', (req: Request, res: Response) => {
  const db = getDb();

  // Cascade delete everything
  const ops = db.exec(`SELECT id FROM operations WHERE program_id = '${req.params.id}'`);
  if (ops.length > 0) {
    ops[0].values.forEach(row => {
      const opId = row[0] as string;
      db.run(`DELETE FROM control_photos WHERE control_id IN (SELECT id FROM controls WHERE operation_id = ?)`, [opId]);
      db.run(`DELETE FROM controls WHERE operation_id = ?`, [opId]);
    });
  }
  db.run(`DELETE FROM operations WHERE program_id = ?`, [req.params.id]);
  db.run(`DELETE FROM program_members WHERE program_id = ?`, [req.params.id]);
  db.run(`DELETE FROM board_data WHERE program_id = ?`, [req.params.id]);
  db.run(`DELETE FROM board_sections WHERE program_id = ?`, [req.params.id]);
  db.run(`DELETE FROM notifications WHERE program_id = ?`, [req.params.id]);
  db.run(`DELETE FROM programs WHERE id = ?`, [req.params.id]);
  saveDatabase();

  res.json({ success: true });
});

// POST add member to program
router.post('/programs/:id/members', (req: Request, res: Response) => {
  const { user_id, role } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requis' });

  const db = getDb();

  // Check user exists
  const userCheck = db.exec(`SELECT id FROM users WHERE id = '${user_id}'`);
  if (userCheck.length === 0 || userCheck[0].values.length === 0) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  // Check not already member
  const memberCheck = db.exec(`SELECT id FROM program_members WHERE program_id = '${req.params.id}' AND user_id = '${user_id}'`);
  if (memberCheck.length > 0 && memberCheck[0].values.length > 0) {
    return res.status(409).json({ error: 'Déjà membre de ce programme' });
  }

  const id = uuid();
  db.run(`INSERT INTO program_members (id, program_id, user_id, role) VALUES (?, ?, ?, ?)`,
    [id, req.params.id, user_id, role || 'membre']);
  saveDatabase();

  res.status(201).json({ success: true });
});

// DELETE remove member from program
router.delete('/programs/:programId/members/:userId', (req: Request, res: Response) => {
  const db = getDb();
  db.run(`DELETE FROM program_members WHERE program_id = ? AND user_id = ?`,
    [req.params.programId, req.params.userId]);
  saveDatabase();
  res.json({ success: true });
});

// ════════════════════════════════════════════
//  STATISTIQUES GLOBALES
// ════════════════════════════════════════════

router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const users = db.exec('SELECT COUNT(*) FROM users');
  const programs = db.exec('SELECT COUNT(*) FROM programs');
  const operations = db.exec('SELECT COUNT(*) FROM operations');
  const controls = db.exec('SELECT COUNT(*) FROM controls');

  const activePrograms = db.exec("SELECT COUNT(*) FROM programs WHERE status = 'actif'");
  const conformeControls = db.exec("SELECT COUNT(*) FROM controls WHERE status = 'conforme'");
  const nonConformeControls = db.exec("SELECT COUNT(*) FROM controls WHERE status = 'non_conforme'");

  const byRole = db.exec("SELECT role, COUNT(*) as count FROM users GROUP BY role");
  const roleBreakdown: Record<string, number> = {};
  if (byRole.length > 0) {
    byRole[0].values.forEach(row => {
      roleBreakdown[row[0] as string] = row[1] as number;
    });
  }

  res.json({
    users: users[0]?.values[0][0] || 0,
    programs: programs[0]?.values[0][0] || 0,
    activePrograms: activePrograms[0]?.values[0][0] || 0,
    operations: operations[0]?.values[0][0] || 0,
    controls: controls[0]?.values[0][0] || 0,
    conformeControls: conformeControls[0]?.values[0][0] || 0,
    nonConformeControls: nonConformeControls[0]?.values[0][0] || 0,
    roleBreakdown,
  });
});

export default router;
