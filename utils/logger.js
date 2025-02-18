import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Format du nom de fichier avec date
const getLogFileName = (prefix) => {
    const date = new Date().toISOString().split("T")[0];
    return path.join(__dirname, `../logs/${prefix}-${date}.log`);
};

export async function logRequest(req, method, url) {
    const timestamp = new Date().toISOString();
    const ip = req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";

    const logMessage = `${timestamp} - ${ip} - ${method} ${url} - ${userAgent}\n`;

    try {
        await fs.appendFile(getLogFileName("access"), logMessage);
        console.log(logMessage.trim());
    } catch (error) {
        console.error("Error writing to access log:", error);
    }
}

export async function logError(error, req = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ERROR: ${error.message}\n${error.stack}\n`;

    try {
        await fs.appendFile(getLogFileName("error"), logMessage);
        console.error(logMessage.trim());
    } catch (err) {
        console.error("Error writing to error log:", err);
    }
}
