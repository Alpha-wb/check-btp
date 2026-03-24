import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb, saveDatabase } from '../db/database';
import { generateToken, authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, role, company, phone } = req.body;
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const db = getDb();
    const existing = db.exec(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const id = uuid();
    const password_hash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, company, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, email, password_hash, first_name, last_name, role, company || null, phone || null]
    );
    saveDatabase();

    const token = generateToken({ userId: id, email, role });
    res.status(201).json({
      token,
      user: { id, email, first_name, last_name, role, company, phone }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const db = getDb();
    const result = db.exec(
      `SELECT id, email, password_hash, first_name, last_name, role, company, phone FROM users WHERE email = '${email.replace(/'/g, "''")}'`
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const row = result[0].values[0];
    const user = {
      id: row[0] as string,
      email: row[1] as string,
      password_hash: row[2] as string,
      first_name: row[3] as string,
      last_name: row[4] as string,
      role: row[5] as string,
      company: row[6] as string | null,
      phone: row[7] as string | null
    };

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id, email: user.email, first_name: user.first_name,
        last_name: user.last_name, role: user.role, company: user.company, phone: user.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const db = getDb();
  const result = db.exec(
    `SELECT id, email, first_name, last_name, role, company, phone FROM users WHERE id = '${userId}'`
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const row = result[0].values[0];
  res.json({
    id: row[0], email: row[1], first_name: row[2], last_name: row[3],
    role: row[4], company: row[5], phone: row[6]
  });
});

export default router;
