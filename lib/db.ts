import Database from "better-sqlite3"
import path from "path"

const DB_PATH = path.join(process.cwd(), "spotify-tracker.db")

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma("journal_mode = WAL")
    db.exec(`
      CREATE TABLE IF NOT EXISTS plays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT NOT NULL,
        track_name TEXT NOT NULL,
        artist_name TEXT NOT NULL,
        artist_id TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        played_at TEXT NOT NULL UNIQUE
      )
    `)
  }
  return db
}
