CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('moa','moe','entreprise')),
  company TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'actif' CHECK(status IN ('actif','termine','suspendu')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS program_members (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'membre' CHECK(role IN ('admin','membre','lecteur')),
  added_at TEXT DEFAULT (datetime('now')),
  UNIQUE(program_id, user_id)
);

CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  building TEXT,
  floor TEXT,
  status TEXT NOT NULL DEFAULT 'a_faire' CHECK(status IN ('a_faire','en_cours','termine')),
  assigned_to TEXT REFERENCES users(id),
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS controls (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  fico_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK(status IN ('conforme','non_conforme','en_attente','na')),
  checked_by TEXT REFERENCES users(id),
  checked_at TEXT,
  comments TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS control_photos (
  id TEXT PRIMARY KEY,
  control_id TEXT NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  path TEXT NOT NULL,
  uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  program_id TEXT REFERENCES programs(id),
  created_at TEXT DEFAULT (datetime('now'))
);
