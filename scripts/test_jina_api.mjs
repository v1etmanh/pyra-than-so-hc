import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jinaKey = process.env.JINA_API_KEY;

console.log('=== TEST JINA CLOUD API + SUPABASE PGVECTOR ===');
console.log('Jina API Key:', jinaKey ? jinaKey.slice(0, 10) + '...' : 'MISSING');
console.log('Supabase URL:', supabaseUrl);

async function run() {
  const query = 'Hôm nay ngày cá nhân 1 nên uống cà phê gì?';
  console.log('\nQuery:', query);

  // 1. Call Jina Embedding API
  console.log('\n[1/3] Generating embedding via Jina API...');
  const t0 = Date.now();
  const embResp = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jinaKey}`
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: 'retrieval.query',
      dimensions: 1024,
      late_chunking: false,
      input: [query]
    })
  });
  
  if (!embResp.ok) {
    throw new Error(`Jina Embeddings failed: ${embResp.status} ${await embResp.text()}`);
  }
  const embData = await embResp.json();
  const vector = embData.data[0].embedding;
  console.log(`✓ Jina Embedding (1024d) received in ${Date.now() - t0}ms`);

  // 2. Query Supabase pgvector
  console.log('\n[2/3] Querying Supabase pgvector...');
  const t1 = Date.now();
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: matches, error } = await supabase.rpc('match_numerology_chunks', {
    query_embedding: vector,
    match_threshold: 0.2,
    match_count: 5,
    filter_category: 'daily_decision',
    filter_decision_category: 'drink',
    filter_personal_day: '1'
  });

  if (error) {
    throw new Error(`Supabase RPC failed: ${error.message}`);
  }
  console.log(`✓ Supabase returned ${matches.length} matches in ${Date.now() - t1}ms`);

  // 3. Jina Rerank API
  console.log('\n[3/3] Reranking via Jina Reranker API...');
  const t2 = Date.now();
  const rerankResp = await fetch('https://api.jina.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jinaKey}`
    },
    body: JSON.stringify({
      model: 'jina-reranker-v2-base-multilingual',
      query: query,
      documents: matches.map(m => `${m.title}\n${m.content}`),
      top_n: 3
    })
  });

  if (!rerankResp.ok) {
    throw new Error(`Jina Reranker failed: ${rerankResp.status} ${await rerankResp.text()}`);
  }
  const rerankData = await rerankResp.json();
  console.log(`✓ Jina Reranker finished in ${Date.now() - t2}ms\n`);

  console.log('=== TOP 3 FINAL RANKED RESULTS ===');
  rerankData.results.forEach((r, idx) => {
    const match = matches[r.index];
    console.log(`[${idx + 1}] Title: ${match.title}`);
    console.log(`    Relevance Score: ${r.relevance_score.toFixed(4)} | Initial Similarity: ${match.similarity.toFixed(4)}`);
    console.log(`    Preview: ${match.content.slice(0, 150).replace(/\n/g, ' ')}...\n`);
  });

  console.log('🎉 PIPELINE HOẠT ĐỘNG HOÀN TOÀN CHÍNH XÁC VÀ MƯỢT MÀ!');
}

run().catch(console.error);
