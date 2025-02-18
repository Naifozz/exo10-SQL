import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { logError } from "../utils/logger.js";

const DATABASE_FILE = "./data/articles.db";

async function openDb() {
    return open({
        filename: DATABASE_FILE,
        driver: sqlite3.Database,
    });
}

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
    try {
        const db = await openDb();
        const articles = await db.all("SELECT * FROM articles");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(articles));
    } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
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
        if (!body.category || body.category.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Category cannot be empty" }));
            return;
        }

        const result = await db.run(
            "INSERT INTO articles (title, content, category) VALUES (?, ?, ?)",
            [body.title, body.content, body.category]
        );

        const newArticle = {
            id: result.lastID,
            title: body.title,
            content: body.content,
            category: body.category,
        };

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newArticle));
    } catch (error) {
        await logError(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function updateArticle(req, res, id) {
    try {
        const db = await openDb();
        const body = await parseBody(req);

        // Vérifier si la catégorie est vide
        if (!body.category || body.category.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Category cannot be empty" }));
            return;
        }

        const result = await db.run(
            "UPDATE articles SET title = ?, content = ?, category = ? WHERE id = ?",
            [body.title, body.content, body.category, id]
        );

        if (result.changes === 0) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Article not found" }));
            return;
        }

        const updatedArticle = {
            id: parseInt(id, 10),
            title: body.title,
            content: body.content,
            category: body.category,
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(updatedArticle));
    } catch (error) {
        await logError(error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
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
