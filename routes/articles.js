import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { openDb } from "../utils/db.js";
import { logError } from "../utils/logger.js";

const DATABASE_FILE = "./data/articles.db";

export async function handleRequest(req, res) {
    switch (req.method) {
        case "GET":
            if (req.url === "/articles") {
                await getAllArticles(req, res);
            } else {
                const id = req.url.split("/")[2];
                await getArticleById(req, res, id);
            }
            break;
        case "POST":
            if (req.url === "/articles") {
                await createArticle(req, res);
            } else {
                res.writeHead(405);
                res.end(JSON.stringify({ error: "Invalid URL for POST request" }));
            }
            break;
        case "PUT":
            if (req.url.startsWith("/articles/")) {
                const id = req.url.split("/")[2];
                await updateArticle(req, res, id);
            } else {
                res.writeHead(405);
                res.end(JSON.stringify({ error: "Invalid URL for PUT request" }));
            }
            break;
        case "DELETE":
            if (req.url.startsWith("/articles/")) {
                const id = req.url.split("/")[2];
                await deleteArticle(req, res, id);
            } else {
                res.writeHead(405);
                res.end(JSON.stringify({ error: "Invalid URL for DELETE request" }));
            }
            break;
        default:
            res.writeHead(405);
            res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }
}

async function getAllArticles(req, res) {
    const db = await openDb();
    const articles = await db.all("SELECT * FROM articles");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(articles));
}

async function getArticleById(req, res, id) {
    try {
        const db = await openDb();
        const article = await db.get("SELECT * FROM articles WHERE id = ?", [id]);
        if (!article) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Article not found" }));
            return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(article));
    } catch (error) {
        await logError(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function createArticle(req, res) {
    try {
        const db = await openDb();
        const body = await parseBody(req);

        // Vérifier si la catégorie est vide
        if (!body.title || body.title.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Title cannot be empty" }));
            return;
        }
        if (!body.content || body.content.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Content cannot be empty" }));
            return;
        }
        const now = new Date().toISOString();

        const result = await db.run("INSERT INTO articles (title, content) VALUES (?, ?)", [
            body.title,
            body.content,
        ]);
        const newId = result.lastID;

        const createdArticle = await db.get("SELECT * FROM articles WHERE id = ?", [newId]);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(createdArticle));
    } catch (error) {
        await logError(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function updateArticle(req, res) {
    try {
        // Extraire l'ID de façon plus fiable
        let idStr = req.url.split("/").pop();
        const id = parseInt(idStr, 10);

        if (isNaN(id)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "ID d'article invalide" }));
            return;
        }

        const db = await openDb();
        const body = await parseBody(req);

        // Validation
        if (!body.title || body.title.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Le titre ne peut pas être vide" }));
            return;
        }

        if (!body.content || body.content.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Le contenu ne peut pas être vide" }));
            return;
        }

        // Vérifier si l'article existe
        const article = await db.get("SELECT * FROM articles WHERE id = ?", [id]);
        if (!article) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Article non trouvé" }));
            return;
        }

        // Mettre à jour l'article
        await db.run("UPDATE articles SET title = ?, content = ? WHERE id = ?", [
            body.title,
            body.content,
            id,
        ]);

        // Récupérer l'article mis à jour
        const updatedArticle = await db.get("SELECT * FROM articles WHERE id = ?", [id]);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(updatedArticle));
    } catch (error) {
        console.error("Erreur dans updateArticle:", error);
        await logError(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                error: "Erreur interne du serveur",
                details: process.env.NODE_ENV === "development" ? error.message : undefined,
            })
        );
    }
}

async function deleteArticle(req, res, id) {
    try {
        const db = await openDb();
        const result = await db.run("DELETE FROM articles WHERE id = ?", [id]);
        if (result.changes === 0) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Article not found" }));
            return;
        }
        res.writeHead(204);
        res.end();
    } catch (error) {
        await logError(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            try {
                const parsedBody = JSON.parse(body);
                resolve(parsedBody);
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", (error) => {
            reject(error);
        });
    });
}

export { getAllArticles, getArticleById, createArticle, updateArticle, deleteArticle };
