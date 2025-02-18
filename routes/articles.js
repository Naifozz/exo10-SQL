import { readJsonFile, writeJsonFile } from "../utils/file-utils.js";
import { logError } from "../utils/logger.js";

const ARTICLES_FILE = "./data/articles.json";

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
        const data = await readJsonFile(ARTICLES_FILE);
        res.writeHead(200);
        res.end(JSON.stringify(data.articles));
    } catch (error) {
        await logError(error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function getArticleById(req, res, id) {
    try {
        const data = await readJsonFile(ARTICLES_FILE);
        const articleId = parseInt(id, 10);
        const article = data.articles.find((a) => a.id === articleId);

        if (!article) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Article not found" }));
            return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(article));
    } catch (error) {
        await logError(error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function createArticle(req, res) {
    try {
        const data = await readJsonFile(ARTICLES_FILE);
        const body = await parseBody(req);

        // Vérifier si la catégorie est vide
        if (
            !body.title ||
            (body.title.trim() === "" && !body.content) ||
            body.content.trim() === ""
        ) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Category cannot be empty" }));
            return;
        }

        const newArticle = { ...body, id: data.articles.length + 1 };

        data.articles.push(newArticle);
        await writeJsonFile(ARTICLES_FILE, data);

        res.writeHead(201);
        res.end(JSON.stringify(newArticle));
    } catch (error) {
        await logError(error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function updateArticle(req, res, id) {
    try {
        const data = await readJsonFile(ARTICLES_FILE);
        const articleId = parseInt(id, 10);
        const index = data.articles.findIndex((a) => a.id === articleId);
        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Article not found" }));
            return;
        }
        const body = await parseBody(req);

        // Vérifier si la catégorie est vide
        if (
            !body.title ||
            (body.title.trim() === "" && !body.content) ||
            body.content.trim() === ""
        ) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Category cannot be empty" }));
            return;
        }

        const updatedArticle = { ...data.articles[index], ...body };
        data.articles[index] = updatedArticle;
        await writeJsonFile(ARTICLES_FILE, data);
        res.writeHead(200);
        res.end(JSON.stringify(updatedArticle));
    } catch (error) {
        await logError(error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function deleteArticle(req, res, id) {
    try {
        const data = await readJsonFile(ARTICLES_FILE);
        const articleId = parseInt(id, 10);
        const index = data.articles.findIndex((a) => a.id === articleId);
        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Article not found" }));
            return;
        }
        data.articles.splice(index, 1);
        await writeJsonFile(ARTICLES_FILE, data);
        res.writeHead(204);
        res.end();
    } catch (error) {
        await logError(error);
        res.writeHead(500);
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
