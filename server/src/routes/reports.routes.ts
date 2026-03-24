import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { getDb } from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

function queryToObjects(db: any, sql: string) {
  const result = db.exec(sql);
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const obj: any = {};
    cols.forEach((c: string, i: number) => obj[c] = row[i]);
    return obj;
  });
}

router.get('/program/:id', (req: Request, res: Response) => {
  const db = getDb();
  const program = queryToObjects(db, `SELECT * FROM programs WHERE id = '${req.params.id}'`);
  if (program.length === 0) return res.status(404).json({ error: 'Programme non trouvé' });

  const operations = queryToObjects(db, `SELECT * FROM operations WHERE program_id = '${req.params.id}'`);
  const opIds = operations.map((o: any) => `'${o.id}'`).join(',');

  let controls: any[] = [];
  if (opIds) {
    controls = queryToObjects(db, `SELECT * FROM controls WHERE operation_id IN (${opIds})`);
  }

  const total = controls.length;
  const conforme = controls.filter((c: any) => c.status === 'conforme').length;
  const nonConforme = controls.filter((c: any) => c.status === 'non_conforme').length;
  const enAttente = controls.filter((c: any) => c.status === 'en_attente').length;

  res.json({
    program: program[0],
    operations: operations.length,
    controls: { total, conforme, nonConforme, enAttente },
    conformityRate: total > 0 ? Math.round((conforme / total) * 100) : 0
  });
});

router.get('/program/:id/pdf', (req: Request, res: Response) => {
  const db = getDb();
  const program = queryToObjects(db, `SELECT * FROM programs WHERE id = '${req.params.id}'`);
  if (program.length === 0) return res.status(404).json({ error: 'Programme non trouvé' });

  const operations = queryToObjects(db, `SELECT * FROM operations WHERE program_id = '${req.params.id}'`);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=rapport-${program[0].name}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).text('Rapport de Suivi - Check BTP', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(program[0].name, { align: 'center' });
  doc.fontSize(10).text(`${program[0].address || ''} ${program[0].city || ''}`, { align: 'center' });
  doc.moveDown(2);

  // Stats
  for (const op of operations) {
    const controls = queryToObjects(db, `SELECT * FROM controls WHERE operation_id = '${op.id}'`);
    const total = controls.length;
    const conforme = controls.filter((c: any) => c.status === 'conforme').length;

    doc.fontSize(14).text(op.name, { underline: true });
    doc.fontSize(10).text(`Statut: ${op.status} | Contrôles: ${conforme}/${total} conformes`);
    doc.moveDown();

    for (const ctrl of controls) {
      const statusIcon = ctrl.status === 'conforme' ? '[OK]' : ctrl.status === 'non_conforme' ? '[NOK]' : '[--]';
      doc.fontSize(9).text(`  ${statusIcon} ${ctrl.fico_type} - ${ctrl.status}${ctrl.comments ? ' | ' + ctrl.comments : ''}`);
    }
    doc.moveDown();
  }

  doc.fontSize(8).text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par Check BTP`, { align: 'center' });
  doc.end();
});

export default router;
