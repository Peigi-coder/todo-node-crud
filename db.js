
const Database = require("better-sqlite3");

const db = new Database("todo.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 3,
    deadline TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`);

module.exports = db;
