/**
 * Jina AI Embeddings v3 & Reranker Service
 * Provides dense multilingual embeddings and reranking for Numerology RAG.
 */

export interface JinaEmbeddingResponse {
  model: string;
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
  };
}

export async function getJinaEmbedding(
  text: string,
  task: 'retrieval.query' | 'retrieval.passage' = 'retrieval.query'
): Promise<number[]> {
  const mode = (process.env.JINA_MODE || (process.env.JINA_API_KEY ? 'api' : 'local')).toLowerCase();
  if (mode === 'local') {
    const { getLocalJinaEmbedding } = await import('./jina-local-client');
    return getLocalJinaEmbedding(text, task);
  }

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error('JINA_API_KEY environment variable is not configured');
  }

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: task,
      dimensions: 1024,
      late_chunking: false,
      input: [text],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jina Embedding API failed (${response.status}): ${errorText}`);
  }

  const resData: JinaEmbeddingResponse = await response.json();
  return resData.data[0].embedding;
}

export async function jinaRerank(
  query: string,
  documents: string[],
  topN: number = 3
) {
  const mode = (process.env.JINA_MODE || (process.env.JINA_API_KEY ? 'api' : 'local')).toLowerCase();
  if (mode === 'local') {
    const { localJinaRerank } = await import('./jina-local-client');
    const results = await localJinaRerank(query, documents);
    return { results: results.sort((a, b) => b.relevance_score - a.relevance_score).slice(0, topN) };
  }

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error('JINA_API_KEY environment variable is not configured');
  }

  const response = await fetch('https://api.jina.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'jina-reranker-v2-base-multilingual',
      query: query,
      documents: documents,
      top_n: topN,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jina Rerank API failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}
