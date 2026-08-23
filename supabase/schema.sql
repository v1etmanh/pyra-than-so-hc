-- ==========================================================
-- SUPABASE PGVECTOR SCHEMA FOR NUMEROLOGY RAG SYSTEM
-- ==========================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create numerology_chunks table
create table if not exists numerology_chunks (
    id text primary key,
    doc_id text not null,
    source_file text,
    category text not null,
    indicator_key text,
    indicator_name text,
    number_value text,
    question_id text,
    decision_category text,
    personal_day text,
    safety_level text default 'low',
    requires_disclaimer boolean default false,
    content_version text,
    title text not null,
    content text not null,
    keywords text,
    chunk_index int default 0,
    metadata jsonb default '{}'::jsonb,
    embedding vector(1024),            -- Jina Embeddings v3 (1024 dimensions)
    created_at timestamptz default now()
);

-- 3. Create HNSW Index for ultra-fast Cosine Similarity Search
create index if not exists numerology_chunks_embedding_hnsw_idx 
on numerology_chunks 
using hnsw (embedding vector_cosine_ops);

-- 4. Create Indexes for metadata filtering
create index if not exists numerology_chunks_cat_day_idx 
on numerology_chunks (category, personal_day, decision_category);

create index if not exists numerology_chunks_doc_idx 
on numerology_chunks (doc_id);

-- 5. Stored Procedure (RPC) for Vector Search with Metadata Filtering
create or replace function match_numerology_chunks (
  query_embedding vector(1024),
  match_threshold float default 0.2,
  match_count int default 10,
  filter_category text default null,
  filter_decision_category text default null,
  filter_personal_day text default null
)
returns table (
  id text,
  doc_id text,
  category text,
  decision_category text,
  personal_day text,
  question_id text,
  title text,
  content text,
  keywords text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    numerology_chunks.id,
    numerology_chunks.doc_id,
    numerology_chunks.category,
    numerology_chunks.decision_category,
    numerology_chunks.personal_day,
    numerology_chunks.question_id,
    numerology_chunks.title,
    numerology_chunks.content,
    numerology_chunks.keywords,
    numerology_chunks.metadata,
    1 - (numerology_chunks.embedding <=> query_embedding) as similarity
  from numerology_chunks
  where 1 - (numerology_chunks.embedding <=> query_embedding) > match_threshold
    and (filter_category is null or numerology_chunks.category = filter_category)
    and (filter_decision_category is null or numerology_chunks.decision_category = filter_decision_category)
    and (filter_personal_day is null or numerology_chunks.personal_day = filter_personal_day)
  order by similarity desc
  limit match_count;
$$;
