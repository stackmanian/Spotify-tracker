import { neon } from "@neondatabase/serverless"

function getDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return sql
}

export async function initDb() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS plays (
      id SERIAL PRIMARY KEY,
      track_id TEXT NOT NULL,
      track_name TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      played_at TEXT NOT NULL UNIQUE
    )
  `
}

export async function insertPlay(
  trackId: string,
  trackName: string,
  artistName: string,
  artistId: string,
  durationMs: number,
  playedAt: string
): Promise<boolean> {
  const sql = getDb()
  const result = await sql`
    INSERT INTO plays (track_id, track_name, artist_name, artist_id, duration_ms, played_at)
    VALUES (${trackId}, ${trackName}, ${artistName}, ${artistId}, ${durationMs}, ${playedAt})
    ON CONFLICT (played_at) DO NOTHING
  `
  return (result as any).count > 0
}

export async function getPlayedTrackIds(): Promise<Set<string>> {
  const sql = getDb()
  const rows = await sql`SELECT DISTINCT track_id FROM plays`
  return new Set(rows.map(r => r.track_id))
}

export async function getMonthStats() {
  const sql = getDb()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const rows = await sql`
    SELECT COALESCE(SUM(duration_ms), 0) as total_ms, COUNT(*) as play_count
    FROM plays WHERE played_at >= ${startOfMonth}
  `
  return rows[0]
}

export async function getTopTracksByPlays(limit = 10) {
  const sql = getDb()
  return sql`
    SELECT track_id, track_name, artist_name, COUNT(*) as play_count, SUM(duration_ms) as total_ms
    FROM plays
    GROUP BY track_id, track_name, artist_name
    ORDER BY play_count DESC
    LIMIT ${limit}
  `
}

export async function getTopArtistsByTime(limit = 10) {
  const sql = getDb()
  return sql`
    SELECT artist_id, artist_name, SUM(duration_ms) as total_ms, COUNT(*) as play_count
    FROM plays
    GROUP BY artist_id, artist_name
    ORDER BY total_ms DESC
    LIMIT ${limit}
  `
}

export async function getTotalPlays() {
  const sql = getDb()
  const rows = await sql`SELECT COUNT(*) as total FROM plays`
  return rows[0].total
}

export async function getUniqueArtistsThisMonth() {
  const sql = getDb()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const rows = await sql`
    SELECT COUNT(DISTINCT artist_id) as count FROM plays WHERE played_at >= ${startOfMonth}
  `
  return Number(rows[0].count)
}
