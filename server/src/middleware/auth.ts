import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'check-btp-secret-key-change-in-production';

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

export function superAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès réservé au Super Admin' });
  }
  next();
}
