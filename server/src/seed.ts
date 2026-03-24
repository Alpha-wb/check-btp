import { getDb, saveDatabase } from './db/database';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export async function runSeed() {
  const db = getDb();

  // Clean existing data
  db.run('DELETE FROM control_photos');
  db.run('DELETE FROM controls');
  db.run('DELETE FROM notifications');
  db.run('DELETE FROM operations');
  db.run('DELETE FROM program_members');
  db.run('DELETE FROM programs');
  db.run('DELETE FROM users');

  // === USERS ===
  const pwHash = await bcrypt.hash('demo2024', 10);

  const moeId = uuid();
  const moaId = uuid();
  const entId = uuid();

  db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [moeId, 'moe@alpha-isi.fr', pwHash, 'Jean', 'Dupont', 'moe', 'GROUPE ALPHA ISI', '01 42 00 00 00']);
  db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [moaId, 'moa@alpha-isi.fr', pwHash, 'Marie', 'Laurent', 'moa', 'Nexity', '01 43 00 00 00']);
  db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [entId, 'entreprise@alpha-isi.fr', pwHash, 'Pierre', 'Martin', 'entreprise', 'Bouygues Bâtiment', '01 44 00 00 00']);

  // === PROGRAMME ===
  const progId = uuid();
  db.run(`INSERT INTO programs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [progId, 'Résidence Les Jardins de Montsouris', '15 avenue Reille', 'Paris 14e',
     'Programme de 52 logements collectifs du T1 au T4 avec parking souterrain. Certification NF Habitat HQE.',
     '2024-03-01', '2026-06-30', 'actif', moeId]);

  // Members
  db.run(`INSERT INTO program_members VALUES (?, ?, ?, 'admin', datetime('now'))`, [uuid(), progId, moeId]);
  db.run(`INSERT INTO program_members VALUES (?, ?, ?, 'membre', datetime('now'))`, [uuid(), progId, moaId]);
  db.run(`INSERT INTO program_members VALUES (?, ?, ?, 'membre', datetime('now'))`, [uuid(), progId, entId]);

  // === OPERATIONS (Bâtiments) ===
  const batA = uuid();
  const batB = uuid();
  const batC = uuid();

  db.run(`INSERT INTO operations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [batA, progId, 'Bâtiment A - 20 logements', 'Bâtiment principal R+5 avec parking SS', 'A', 'R+5', 'en_cours', entId, '2025-12-15']);
  db.run(`INSERT INTO operations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [batB, progId, 'Bâtiment B - 18 logements', 'Bâtiment secondaire R+4', 'B', 'R+4', 'en_cours', entId, '2026-02-28']);
  db.run(`INSERT INTO operations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [batC, progId, 'Bâtiment C - 14 logements', 'Bâtiment annexe R+3 avec jardins privatifs', 'C', 'R+3', 'a_faire', null, '2026-06-30']);

  // === CONTROLES pour Bâtiment A (avancé) ===
  const ficoDataA: [string, string, string][] = [
    ['FICO01', 'conforme', '{"f01_01":{"status":"conforme","comment":"Cote conforme au plan"},"f01_02":{"status":"conforme","comment":"Sol argileux stabilisé"},"f01_03":{"status":"conforme","comment":"Pas d\'eau constatée"},"f01_04":{"status":"conforme","comment":""},"f01_05":{"status":"conforme","comment":"BC validé le 15/04"}}'],
    ['FICO02', 'conforme', '{"f02_01":{"status":"conforme","comment":"Axes validés au théodolite"},"f02_02":{"status":"conforme","comment":""},"f02_03":{"status":"conforme","comment":"Équerrage OK"},"f02_04":{"status":"conforme","comment":""},"f02_05":{"status":"conforme","comment":""}}'],
    ['FICO03', 'conforme', '{"f03_01":{"status":"conforme","comment":"R < 2 ohms"},"f03_02":{"status":"conforme","comment":""},"f03_03":{"status":"conforme","comment":""},"f03_04":{"status":"conforme","comment":""}}'],
    ['FICO04', 'conforme', '{"f04_01":{"status":"conforme","comment":"Caméra OK - RAS"},"f04_02":{"status":"conforme","comment":"Pentes 1%"},"f04_03":{"status":"conforme","comment":""},"f04_04":{"status":"conforme","comment":""}}'],
    ['FICO05', 'conforme', '{"f05_01":{"status":"conforme","comment":""},"f05_02":{"status":"conforme","comment":""},"f05_03":{"status":"conforme","comment":""},"f05_04":{"status":"conforme","comment":""},"f05_05":{"status":"conforme","comment":"NFP91-12 respectée"}}'],
    ['FICO06', 'conforme', '{"f06_01":{"status":"conforme","comment":"Résilient 5mm posé"},"f06_02":{"status":"conforme","comment":"Ép. 5cm OK"},"f06_03":{"status":"conforme","comment":""},"f06_04":{"status":"conforme","comment":""}}'],
    ['FICO07', 'non_conforme', '{"f07_01":{"status":"conforme","comment":""},"f07_02":{"status":"non_conforme","comment":"Faux aplomb mur SdB lot 12 - reprise demandée"},"f07_03":{"status":"conforme","comment":""},"f07_04":{"status":"conforme","comment":""}}'],
    ['FICO08', 'conforme', '{"f08_01":{"status":"conforme","comment":"R=3.7 conforme"},"f08_02":{"status":"conforme","comment":""},"f08_03":{"status":"conforme","comment":""}}'],
    ['FICO09', 'conforme', '{"f09_01":{"status":"conforme","comment":"Pente 1.5%"},"f09_02":{"status":"conforme","comment":""},"f09_03":{"status":"conforme","comment":"H=1.10m OK"},"f09_04":{"status":"conforme","comment":"Seuil 2cm"}}'],
    ['FICO10', 'conforme', '{"f10_01":{"status":"conforme","comment":""},"f10_02":{"status":"conforme","comment":""},"f10_03":{"status":"conforme","comment":""},"f10_04":{"status":"conforme","comment":""}}'],
    ['FICO11', 'conforme', '{"f11_01":{"status":"conforme","comment":""},"f11_02":{"status":"conforme","comment":""},"f11_03":{"status":"conforme","comment":""}}'],
    ['FICO12', 'conforme', '{"f12_01":{"status":"conforme","comment":""},"f12_02":{"status":"conforme","comment":""},"f12_03":{"status":"conforme","comment":""},"f12_04":{"status":"conforme","comment":""},"f12_05":{"status":"conforme","comment":""}}'],
    ['FICO13', 'en_attente', '{"f13_01":{"status":"conforme","comment":"Pose Alu conforme"},"f13_02":{"status":"en_attente","comment":"En cours de vérification"},"f13_03":{"status":"conforme","comment":""},"f13_04":{"status":"conforme","comment":""}}'],
    ['FICO14', 'en_attente', '{"f14_01":{"status":"conforme","comment":""},"f14_02":{"status":"en_attente","comment":"Plans PDV en attente validation archi"},"f14_03":{"status":"conforme","comment":""},"f14_04":{"status":"conforme","comment":""}}'],
    ['FICO15', 'en_attente', '{}'],
  ];

  for (const [fico, status, data] of ficoDataA) {
    db.run(`INSERT INTO controls VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'))`,
      [uuid(), batA, fico, status, moeId, null, data]);
  }

  // === CONTROLES pour Bâtiment B (début) ===
  const ficoDataB: [string, string, string][] = [
    ['FICO01', 'conforme', '{"f01_01":{"status":"conforme","comment":"OK"},"f01_02":{"status":"conforme","comment":""},"f01_03":{"status":"conforme","comment":""},"f01_04":{"status":"conforme","comment":""},"f01_05":{"status":"conforme","comment":""}}'],
    ['FICO02', 'conforme', '{"f02_01":{"status":"conforme","comment":""},"f02_02":{"status":"conforme","comment":""},"f02_03":{"status":"conforme","comment":""},"f02_04":{"status":"conforme","comment":""},"f02_05":{"status":"conforme","comment":""}}'],
    ['FICO03', 'en_attente', '{}'],
    ['FICO04', 'non_conforme', '{"f04_01":{"status":"non_conforme","comment":"Obstruction réseau EP - curage à refaire"},"f04_02":{"status":"conforme","comment":""},"f04_03":{"status":"non_conforme","comment":"Fuite jonction R3"},"f04_04":{"status":"conforme","comment":""}}'],
  ];

  for (const [fico, status, data] of ficoDataB) {
    db.run(`INSERT INTO controls VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'))`,
      [uuid(), batB, fico, status, moeId, null, data]);
  }

  // === NOTIFICATIONS ===
  db.run(`INSERT INTO notifications VALUES (?, ?, ?, ?, 0, ?, datetime('now'))`,
    [uuid(), moeId, 'control', 'Non-conformité FICO07 Bât.A : Faux aplomb mur SdB lot 12', progId]);
  db.run(`INSERT INTO notifications VALUES (?, ?, ?, ?, 0, ?, datetime('now'))`,
    [uuid(), moeId, 'control', 'Non-conformité FICO04 Bât.B : Obstruction réseau EP', progId]);
  db.run(`INSERT INTO notifications VALUES (?, ?, ?, ?, 0, ?, datetime('now'))`,
    [uuid(), moaId, 'report', 'Nouveau rapport disponible : Résidence Les Jardins de Montsouris', progId]);
  db.run(`INSERT INTO notifications VALUES (?, ?, ?, ?, 1, ?, datetime('now', '-2 days'))`,
    [uuid(), moeId, 'reminder', 'Contrôle FICO15 à effectuer pour Bâtiment A', progId]);

  saveDatabase();
  console.log('Seed completed!');
  console.log('');
  console.log('Comptes de démonstration :');
  console.log('  MOE  : moe@alpha-isi.fr / demo2024');
  console.log('  MOA  : moa@alpha-isi.fr / demo2024');
  console.log('  ENT  : entreprise@alpha-isi.fr / demo2024');
}

// Run standalone if called directly
if (require.main === module) {
  const { initDatabase } = require('./db/database');
  initDatabase().then(() => runSeed()).catch(console.error);
}
