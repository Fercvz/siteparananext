import { readFile, writeFile } from "fs/promises";
import path from "path";

export async function readJsonFile<T>(...segments: string[]): Promise<T> {
  const filePath = path.join(process.cwd(), ...segments);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(data: unknown, ...segments: string[]) {
  const filePath = path.join(process.cwd(), ...segments);
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function readFirstJson<T>(paths: string[][]): Promise<T | null> {
  for (const segments of paths) {
    try {
      return await readJsonFile<T>(...segments);
    } catch (error) {
      console.warn("Erro ao ler JSON:", segments.join(path.sep), error);
    }
  }

  return null;
}
