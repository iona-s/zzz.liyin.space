import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'data.db'));

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
function initDatabase() {
    // User info table
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_info (
            token_id INTEGER PRIMARY KEY,
            avatar INTEGER NOT NULL,
            uid INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);

    // User achievement data table (stores the entire achievement state per user)
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_achievement (
            uid INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (uid) REFERENCES user_info(uid) ON DELETE CASCADE
        )
    `);

    // User textjoin data table
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_textjoin (
            uid INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (uid) REFERENCES user_info(uid) ON DELETE CASCADE
        )
    `);

    // User custom not achieved data table
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_custom_not_achieved (
            uid INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (uid) REFERENCES user_info(uid) ON DELETE CASCADE
        )
    `);

    // Create indexes for better performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_user_info_uid ON user_info(uid);
        CREATE INDEX IF NOT EXISTS idx_user_achievement_updated ON user_achievement(updated_at);
        CREATE INDEX IF NOT EXISTS idx_user_textjoin_updated ON user_textjoin(updated_at);
        CREATE INDEX IF NOT EXISTS idx_user_custom_not_achieved_updated ON user_custom_not_achieved(updated_at);
    `);

    console.log('Database initialized successfully');
}

initDatabase();

export default db;

