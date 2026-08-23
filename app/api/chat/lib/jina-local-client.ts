import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

const DEFAULT_PORT = 5117;
let localProcess: ChildProcess | null = null;
let startPromise: Promise<void> | null = null;

function getBaseUrl(): string {
  if (process.env.JINA_LOCAL_URL?.trim()) {
    return process.env.JINA_LOCAL_URL.trim().replace(/\/$/, '');
  }
  return `http://127.0.0.1:${process.env.JINA_LOCAL_PORT || DEFAULT_PORT}`;
}

async function isHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/health`, {
      signal: AbortSignal.timeout(1000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

function getPythonCommand(): string {
  if (process.env.PYTHON_BIN?.trim()) return process.env.PYTHON_BIN.trim();
  return process.platform === 'win32' ? 'python' : 'python3';
}

async function ensureServer(): Promise<void> {
  if (await isHealthy()) return;
  if (process.env.JINA_LOCAL_AUTOSTART === 'false') {
    throw new Error('Jina local service is not running. Start scripts/jina_local_server.py first.');
  }
  if (startPromise) return startPromise;

  startPromise = (async () => {
    if (!localProcess) {
      const scriptPath = path.join(process.cwd(), 'scripts', 'jina_local_server.py');
      localProcess = spawn(getPythonCommand(), [scriptPath], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'ignore',
        windowsHide: true
      });
      localProcess.unref();
    }

    const timeoutAt = Date.now() + Number(process.env.JINA_LOCAL_START_TIMEOUT_MS || 120_000);
    while (Date.now() < timeoutAt) {
      if (await isHealthy()) return;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('Timed out while starting the local Jina service.');
  })();

  try {
    await startPromise;
  } finally {
    startPromise = null;
  }
}

async function postLocal<T>(pathname: string, payload: unknown): Promise<T> {
  await ensureServer();
  const response = await fetch(`${getBaseUrl()}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || `Jina local request failed (${response.status})`);
  }
  return data;
}

export async function getLocalJinaEmbedding(
  text: string,
  task: 'retrieval.query' | 'retrieval.passage'
): Promise<number[]> {
  const response = await postLocal<{ embeddings: number[][] }>('/embed', {
    texts: [text],
    task
  });
  return response.embeddings[0];
}

export async function localJinaRerank(
  query: string,
  documents: string[]
): Promise<{ index: number; relevance_score: number }[]> {
  const response = await postLocal<{
    results: { index: number; relevance_score: number }[];
  }>('/rerank', { query, documents });
  return response.results;
}
