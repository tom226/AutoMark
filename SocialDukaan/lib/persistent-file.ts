import fs from "fs";
import os from "os";
import path from "path";

const TMP_DATA_ROOT = path.join(os.tmpdir(), "socialdukaan");

function isLikelyReadOnlyRuntime(): boolean {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.AWS_EXECUTION_ENV) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    process.cwd().startsWith("/var/task")
  );
}

function isReadOnlyFsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

export function getPersistentFileCandidates(relativePath: string): string[] {
  const localFile = path.join(process.cwd(), relativePath);
  const tempFile = path.join(TMP_DATA_ROOT, relativePath);

  return isLikelyReadOnlyRuntime() ? [tempFile, localFile] : [localFile, tempFile];
}

export async function readFirstExistingJson<T>(candidates: string[]): Promise<T | null> {
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      // Try next candidate path.
    }
  }
  return null;
}

export async function writeJsonWithFallback(candidates: string[], payload: unknown): Promise<void> {
  const serialized = JSON.stringify(payload, null, 2);
  let lastError: unknown;

  for (const filePath of candidates) {
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, serialized, "utf-8");
      return;
    } catch (error) {
      lastError = error;
      if (!isReadOnlyFsError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to persist JSON data");
}

export async function deleteFiles(candidates: string[]): Promise<void> {
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch {
      // Ignore delete errors to preserve current behavior.
    }
  }
}
