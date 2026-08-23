/**
 * Supabase Client & Direct Knowledge Retrieval Service
 * Queries the `numerology_knowledge` table in Supabase PostgreSQL with sub-100ms latency.
 * Provides a local markdown fallback if offline or credentials are missing.
 */
import fs from 'fs';
import path from 'path';

export interface NumerologyKnowledgeRecord {
  id: string;
  indicator_key: string;
  number_value: string;
  indicator_name: string;
  title: string;
  category: string;
  content: string;
  keywords?: string[];
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  return { url: url?.replace(/\/$/, ''), key };
}

/**
 * Fallback to read directly from local `knowledge/*.md` if database is unreachable.
 */
function getLocalKnowledgeFallback(
  indicatorKey: string,
  numberValue: string | number
): NumerologyKnowledgeRecord | null {
  try {
    const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
    if (!fs.existsSync(knowledgeDir)) return null;

    const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith('.md') && !f.endsWith('_all.md'));
    const targetVal = String(numberValue).trim();

    for (const filename of files) {
      const filePath = path.join(knowledgeDir, filename);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
      if (!match) continue;

      const frontmatterStr = match[1];
      const body = match[2].trim();
      const meta: Record<string, string> = {};

      frontmatterStr.split(/\r?\n/).forEach((line) => {
        const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
        if (kv) {
          meta[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
        }
      });

      if (
        meta.indicator_key === indicatorKey &&
        (meta.number_value === targetVal ||
          meta.number_value === targetVal.replace('/', '_') ||
          (meta.number_value && targetVal.includes(meta.number_value)))
      ) {
        return {
          id: meta.id || filename.replace('.md', ''),
          indicator_key: meta.indicator_key,
          number_value: meta.number_value,
          indicator_name: meta.indicator_name || meta.title || '',
          title: meta.title || filename.replace('.md', ''),
          category: meta.category || 'general',
          content: body,
          keywords: meta.keywords ? meta.keywords.split(',').map((k) => k.trim()) : []
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('[Knowledge Fallback] Error reading local markdown:', err);
    return null;
  }
}

/**
 * Supports the pgvector schema currently checked into this repo.
 * `numerology_chunks` stores one row per section and identifies the number
 * through `number_tag` (for example, "Số 7"), so normalize it to the same
 * record shape used by the key/value knowledge table.
 */
async function getKnowledgeFromChunks(
  url: string,
  key: string,
  indicatorKey: string,
  numberValue: string | number
): Promise<NumerologyKnowledgeRecord | null> {
  const value = String(numberValue).trim();
  const tags = [`Số ${value}`, value];

  for (const tag of tags) {
    try {
      const endpoint =
        `${url}/rest/v1/numerology_chunks?number_tag=eq.${encodeURIComponent(tag)}` +
        '&select=id,number_tag,indicator_type,section,title,content,key_concepts&limit=1';
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        cache: 'no-store'
      });

      if (!response.ok) continue;
      const rows = (await response.json()) as Array<{
        id?: string | number;
        number_tag?: string;
        indicator_type?: string;
        section?: string;
        title?: string;
        content?: string;
        key_concepts?: string[];
      }>;
      const row = rows[0];
      if (!row?.content) continue;

      return {
        id: String(row.id ?? `${indicatorKey}-${value}`),
        indicator_key: indicatorKey,
        number_value: value,
        indicator_name: indicatorKey,
        title: row.title || `${row.number_tag || tag} - ${row.section || row.indicator_type || 'knowledge'}`,
        category: row.section || row.indicator_type || 'general',
        content: row.content,
        keywords: row.key_concepts || []
      };
    } catch (error) {
      console.warn('[Supabase Chunks] Fetch failed:', error);
    }
  }

  return null;
}

/**
 * Direct Key-Value Retrieval from Supabase PostgreSQL (O(1) search).
 */
export async function getKnowledgeByIndicator(
  indicatorKey: string,
  numberValue: string | number
): Promise<NumerologyKnowledgeRecord | null> {
  const { url, key } = getSupabaseConfig();
  const valStr = String(numberValue).trim();

  if (url && key) {
    try {
      const encodedVal = encodeURIComponent(valStr);
      const endpoint = `${url}/rest/v1/numerology_knowledge?indicator_key=eq.${indicatorKey}&number_value=eq.${encodedVal}&select=*`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data: NumerologyKnowledgeRecord[] = await response.json();
        if (data && data.length > 0) {
          return data[0];
        }
      } else {
        console.warn(`[Supabase Knowledge] Query returned status ${response.status}`);
      }

      const chunkRecord = await getKnowledgeFromChunks(url, key, indicatorKey, numberValue);
      if (chunkRecord) return chunkRecord;
    } catch (error) {
      console.warn('[Supabase Knowledge] Fetch failed, switching to local fallback:', error);
    }
  }

  // Fallback to local files if Supabase misses or fails
  return getLocalKnowledgeFallback(indicatorKey, numberValue);
}
