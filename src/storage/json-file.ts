import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/** Legge un file di testo; restituisce null se non esiste. */
export async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

/** Scrive in modo atomico (file temporaneo + rename) creando la cartella se serve. */
export async function writeTextAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, filePath);
}
