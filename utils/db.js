import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { logError } from "./logger.js";

/**
 * Ouvre une connexion à la base de données SQLite.
 * @returns {Promise<import('sqlite').Database>} Instance de la base de données.
 */
export async function openDb() {
    try {
        const db = await open({
            filename: "./database.db",
            driver: sqlite3.Database,
        });

        // S'assurer que la table existe
        await initDb(db);

        return db;
    } catch (error) {
        await logError(error);
        throw new Error("Failed to open database");
    }
}

/**
 * Initialise la structure de la base de données.
 * @param {import('sqlite').Database} db - Instance de la base de données.
 */
async function initDb(db) {
    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (error) {
        await logError(error);
        throw new Error("Failed to initialize database");
    }
}
