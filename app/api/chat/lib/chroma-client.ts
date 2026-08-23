import { spawn } from 'node:child_process';
import path from 'node:path';

export interface ChromaMatch {
  id: string;
  document: string;
  metadata: Record<string, string | number | boolean>;
  distance: number | null;
  score: number | null;
}

interface ChromaQueryPayload {
  query: string;
  query_embedding?: number[];
  top_k?: number;
  where?: Record<string, unknown>;
}

interface ChromaQueryResponse {
  matches?: ChromaMatch[];
  error?: string;
}

function getPythonCommand(): string {
  if (process.env.PYTHON_BIN?.trim()) return process.env.PYTHON_BIN.trim();
  return process.platform === 'win32' ? 'python' : 'python3';
}

export async function queryChroma(
  payload: ChromaQueryPayload,
  timeoutMs = 30_000
): Promise<ChromaMatch[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'query_chromadb.py');
  const child = spawn(getPythonCommand(), [scriptPath], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish(() => reject(new Error('ChromaDB query timed out')));
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      finish(() => reject(error));
    });
    child.on('close', (code) => {
      finish(() => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `ChromaDB bridge exited with code ${code}`));
          return;
        }

        try {
          const response = JSON.parse(stdout.trim()) as ChromaQueryResponse;
          if (response.error) throw new Error(response.error);
          resolve(response.matches ?? []);
        } catch (error) {
          reject(
            new Error(
              `Invalid ChromaDB bridge response: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      });
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}
