import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const EXPECTED_TOTAL = 608;
const EXPECTED_LOCALE_COUNTS = { en: 304, vi: 304 };
const BATCH_SIZE = 100;
const TABLE = 'numerology_knowledge';
const SELECT_COLUMNS = [
  'source_id',
  'indicator_key',
  'number_value',
  'locale',
  'indicator_name',
  'title',
  'category',
  'content',
  'keywords',
  'source',
  'review_status',
  'source_revision',
  'reviewed_by',
  'created_at'
].join(',');

function parseMode(argv) {
  const flags = argv.slice(2);
  if (flags.length === 0) return 'dry-run';
  if (flags.length !== 1 || !['--apply', '--verify-only'].includes(flags[0])) {
    throw new Error('Usage: node scripts/restore-numerology-knowledge.mjs [--apply|--verify-only]');
  }
  return flags[0] === '--apply' ? 'apply' : 'verify-only';
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function requireRemoteConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  return { serviceRoleKey, url };
}

function rowKey(row) {
  return `${row.indicator_key}\u001f${row.number_value}\u001f${row.locale}`;
}

function normalizeTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid created_at timestamp: ${value}`);
  return parsed.toISOString();
}

function canonicalRow(row) {
  return {
    category: row.category,
    content: row.content,
    created_at: normalizeTimestamp(row.created_at),
    indicator_key: row.indicator_key,
    indicator_name: row.indicator_name,
    keywords: [...row.keywords],
    locale: row.locale,
    number_value: row.number_value,
    review_status: row.review_status,
    reviewed_by: row.reviewed_by,
    source: row.source,
    source_id: row.source_id || null,
    source_revision: row.source_revision,
    title: row.title
  };
}

function datasetHash(rows) {
  const canonical = rows
    .map(canonicalRow)
    .sort((a, b) => rowKey(a).localeCompare(rowKey(b)))
    .map((row) => JSON.stringify(row))
    .join('\n');
  return createHash('sha256').update(canonical).digest('hex');
}

function readAndValidateBackup(dbPath) {
  if (!fs.existsSync(dbPath)) throw new Error(`Backup not found: ${dbPath}`);
  const runSqliteJson = (sql) => {
    let output;
    try {
      output = execFileSync('sqlite3', ['-readonly', '-json', dbPath, sql], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true
      });
    } catch (error) {
      throw new Error(`Unable to read SQLite backup with the sqlite3 CLI: ${error.message}`);
    }
    try {
      return output.trim() ? JSON.parse(output) : [];
    } catch {
      throw new Error('sqlite3 returned invalid JSON.');
    }
  };

  const integrity = runSqliteJson('PRAGMA quick_check;');
  if (integrity.length !== 1 || integrity[0].quick_check !== 'ok') {
    throw new Error(`SQLite integrity check failed: ${JSON.stringify(integrity)}`);
  }

  const sourceRows = runSqliteJson(`
      select
        source_id, indicator_key, number_value, locale, indicator_name, title,
        category, content, keywords_json, source, review_status,
        source_revision, reviewed_by, created_at
      from numerology_knowledge
      order by indicator_key, number_value, locale
    `);

  if (sourceRows.length !== EXPECTED_TOTAL) {
    throw new Error(`Expected ${EXPECTED_TOTAL} backup rows, found ${sourceRows.length}.`);
  }

  const counts = { en: 0, vi: 0 };
  const keys = new Set();
  const rows = sourceRows.map((row, index) => {
    if (!['vi', 'en'].includes(row.locale)) throw new Error(`Invalid locale at row ${index + 1}.`);
    counts[row.locale] += 1;
    if (!row.indicator_key?.trim() || !row.number_value?.trim()) {
      throw new Error(`Missing lookup key at row ${index + 1}.`);
    }
    if (!row.content?.trim()) throw new Error(`Empty content at ${rowKey(row)}.`);
    if (row.review_status !== 'approved') throw new Error(`Unapproved row at ${rowKey(row)}.`);
    if (keys.has(rowKey(row))) throw new Error(`Duplicate lookup key: ${rowKey(row)}.`);
    keys.add(rowKey(row));

    let keywords;
    try {
      keywords = JSON.parse(row.keywords_json);
    } catch {
      throw new Error(`Invalid keywords_json at ${rowKey(row)}.`);
    }
    if (!Array.isArray(keywords) || keywords.some((keyword) => typeof keyword !== 'string')) {
      throw new Error(`keywords_json must be a string array at ${rowKey(row)}.`);
    }

    return {
      source_id: row.source_id || null,
      indicator_key: row.indicator_key,
      number_value: row.number_value,
      locale: row.locale,
      indicator_name: row.indicator_name,
      title: row.title,
      category: row.category,
      content: row.content,
      keywords,
      source: row.source,
      review_status: row.review_status,
      source_revision: row.source_revision,
      reviewed_by: row.reviewed_by,
      created_at: row.created_at || null
    };
  });

  for (const [locale, expected] of Object.entries(EXPECTED_LOCALE_COUNTS)) {
    if (counts[locale] !== expected) {
      throw new Error(`Expected ${expected} ${locale} rows, found ${counts[locale]}.`);
    }
  }

  return { counts, hash: datasetHash(rows), rows };
}

async function remoteRequest(config, relativeUrl, options = {}) {
  const response = await fetch(`${config.url}/rest/v1/${relativeUrl}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      ...(options.headers || {})
    }
  });
  return response;
}

async function fetchRemoteRows(config) {
  const params = new URLSearchParams({ select: SELECT_COLUMNS });
  const response = await remoteRequest(config, `${TABLE}?${params}`, {
    headers: { Prefer: 'count=exact', Range: '0-999' }
  });
  if (response.status === 404) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Supabase table is missing (${error.code || response.status}). Run the restore migration in SQL Editor first.`
    );
  }
  if (!response.ok) {
    throw new Error(`Unable to read Supabase table (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

function compareDatasets(sourceRows, remoteRows) {
  const sourceByKey = new Map(sourceRows.map((row) => [rowKey(row), canonicalRow(row)]));
  const remoteByKey = new Map(remoteRows.map((row) => [rowKey(row), canonicalRow(row)]));
  const missing = [...sourceByKey.keys()].filter((key) => !remoteByKey.has(key));
  const extra = [...remoteByKey.keys()].filter((key) => !sourceByKey.has(key));
  const changed = [...sourceByKey.keys()].filter((key) => {
    if (!remoteByKey.has(key)) return false;
    return JSON.stringify(sourceByKey.get(key)) !== JSON.stringify(remoteByKey.get(key));
  });
  return { changed, extra, missing };
}

async function assertAnonDenied(config) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return 'skipped (NEXT_PUBLIC_SUPABASE_ANON_KEY not configured)';
  const params = new URLSearchParams({ select: 'id', limit: '1' });
  const response = await fetch(`${config.url}/rest/v1/${TABLE}?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
  });
  if (response.ok) throw new Error('Security verification failed: anon can read numerology_knowledge.');
  if (![401, 403].includes(response.status)) {
    throw new Error(`Unexpected anon verification status: ${response.status}.`);
  }
  return `denied (${response.status})`;
}

async function verifyRemote(config, backup) {
  const remoteRows = await fetchRemoteRows(config);
  const comparison = compareDatasets(backup.rows, remoteRows);
  if (comparison.missing.length || comparison.extra.length || comparison.changed.length) {
    throw new Error(
      `Remote verification failed: ${comparison.missing.length} missing, ` +
      `${comparison.extra.length} extra, ${comparison.changed.length} changed.`
    );
  }
  const localeCounts = remoteRows.reduce((counts, row) => {
    counts[row.locale] = (counts[row.locale] || 0) + 1;
    return counts;
  }, {});
  if (
    remoteRows.length !== EXPECTED_TOTAL ||
    localeCounts.vi !== EXPECTED_LOCALE_COUNTS.vi ||
    localeCounts.en !== EXPECTED_LOCALE_COUNTS.en
  ) {
    throw new Error(`Unexpected remote counts: ${JSON.stringify(localeCounts)}, total ${remoteRows.length}.`);
  }
  const anonResult = await assertAnonDenied(config);
  return { anonResult, hash: datasetHash(remoteRows), localeCounts, total: remoteRows.length };
}

async function applyBackup(config, backup) {
  const existing = await fetchRemoteRows(config);
  const sourceKeys = new Set(backup.rows.map(rowKey));
  const extra = existing.filter((row) => !sourceKeys.has(rowKey(row)));
  if (extra.length) {
    throw new Error(`Refusing to import: Supabase contains ${extra.length} keys not present in the backup.`);
  }

  for (let offset = 0; offset < backup.rows.length; offset += BATCH_SIZE) {
    const batch = backup.rows.slice(offset, offset + BATCH_SIZE);
    const params = new URLSearchParams({ on_conflict: 'indicator_key,number_value,locale' });
    const response = await remoteRequest(config, `${TABLE}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(batch)
    });
    if (!response.ok) {
      throw new Error(`Import batch ${offset}-${offset + batch.length - 1} failed (${response.status}): ${await response.text()}`);
    }
    console.log(`Imported ${Math.min(offset + batch.length, backup.rows.length)}/${backup.rows.length} rows.`);
  }
}

async function main() {
  const mode = parseMode(process.argv);
  const root = process.cwd();
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const backupPath = path.join(root, 'data', 'cadao.db');
  const backup = readAndValidateBackup(backupPath);
  console.log(`Backup valid: ${backup.rows.length} rows (${backup.counts.vi} vi, ${backup.counts.en} en).`);
  console.log(`Backup SHA-256: ${backup.hash}`);
  console.log('Known source gap retained: walksOfLife=1 is absent for both vi and en.');

  if (mode === 'dry-run') {
    console.log('Dry-run complete. No remote requests or writes were made.');
    return;
  }

  const config = requireRemoteConfig();
  if (mode === 'apply') await applyBackup(config, backup);
  const verified = await verifyRemote(config, backup);
  console.log(`Remote verified: ${verified.total} rows (${verified.localeCounts.vi} vi, ${verified.localeCounts.en} en).`);
  console.log(`Remote SHA-256: ${verified.hash}`);
  console.log(`Anon access: ${verified.anonResult}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
