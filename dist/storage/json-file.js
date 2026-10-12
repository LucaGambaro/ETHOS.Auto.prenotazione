"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTextIfExists = readTextIfExists;
exports.writeTextAtomic = writeTextAtomic;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
/** Legge un file di testo; restituisce null se non esiste. */
async function readTextIfExists(filePath) {
    try {
        return await (0, promises_1.readFile)(filePath, "utf8");
    }
    catch (err) {
        if (err instanceof Error && "code" in err && err.code === "ENOENT") {
            return null;
        }
        throw err;
    }
}
/** Scrive in modo atomico (file temporaneo + rename) creando la cartella se serve. */
async function writeTextAtomic(filePath, content) {
    await (0, promises_1.mkdir)(node_path_1.default.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    await (0, promises_1.writeFile)(tmp, content, "utf8");
    await (0, promises_1.rename)(tmp, filePath);
}
