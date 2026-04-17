import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './db/database';
import authRoutes from './routes/auth.routes';
import programsRoutes from './routes/programs.routes';
import operationsRoutes from './routes/operations.routes';
import controlsRoutes from './routes/controls.routes';
import reportsRoutes from './routes/reports.routes';
import usersRoutes from './routes/users.routes';
import boardRoutes from './routes/board.routes';
import adminRoutes from './routes/admin.routes';

const PORT = process.env.PORT || 3001;

async function start() {
  await initDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  app.use('/uploads/documents', express.static(path.join(__dirname, '..', 'uploads', 'documents')));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', name: 'Check BTP API' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/programs', programsRoutes);
  app.use('/api', operationsRoutes);
  app.use('/api', controlsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api', usersRoutes);
  app.use('/api', boardRoutes);
  app.use('/api/admin', adminRoutes);

  // Production: serve React frontend
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  const HOST = '0.0.0.0';
  app.listen(Number(PORT), HOST, () => {
    console.log(`Check BTP running on ${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error('FATAL: Failed to start server:', err);
  process.exit(1);
});
