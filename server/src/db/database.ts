import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'checkbtp.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database;

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schema);
  saveDatabase();

  // Auto-seed if database is empty (for cloud deploy with ephemeral filesystem)
  const result = db.exec('SELECT COUNT(*) FROM users');
  const userCount = result.length > 0 ? (result[0].values[0][0] as number) : 0;
  if (userCount === 0) {
    console.log('Database empty, running auto-seed...');
    const { runSeed } = await import('../seed');
    await runSeed();
    console.log('Auto-seed completed.');
  }

  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}
