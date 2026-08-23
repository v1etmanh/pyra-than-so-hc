/**
 * Ingestion Script for Supabase pgvector + Jina AI.
 * Reads data/master_knowledge.json, generates Jina Embeddings v3,
 * and inserts chunks into Supabase table 'numerology_chunks'.
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { getJinaEmbedding } from '../app/api/chat/lib/jina-service';

interface NumberKnowledge {
  number: string;
  core_essence: string;
  strengths_and_talents: string;
  weaknesses_and_lessons: string;
  career_and_life_path: string;
  relationship_and_behavior: string;
  qa_pair: {
    question: string;
    answer: string;
  };
}

async function insertToSupabase(record: {
  number_tag: string;
  indicator_type: string;
  section: string;
  title: string;
  content: string;
  key_concepts: string[];
  embedding: number[];
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/numerology_chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      number_tag: record.number_tag,
      indicator_type: record.indicator_type,
      section: record.section,
      title: record.title,
      content: record.content,
      key_concepts: record.key_concepts,
      school: 'pythagoras',
      language: 'vi',
      embedding: record.embedding,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase insert failed: ${errText}`);
  }

  console.log(`  ✅ [Supabase Inserted] ${record.title}`);
}

async function main() {
  console.log('🚀 Starting Ingestion to Supabase pgvector with Jina AI Embeddings v3...');

  const dataFilePath = path.join(__dirname, '../data/master_knowledge.json');
  if (!fs.existsSync(dataFilePath)) {
    console.error(`❌ Data file not found at: ${dataFilePath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataFilePath, 'utf-8');
  const knowledgeList: NumberKnowledge[] = JSON.parse(rawData);

  console.log(`📚 Found ${knowledgeList.length} items to process.\n`);

  for (const item of knowledgeList) {
    console.log(`\n========================================`);
    console.log(`📌 Processing: ${item.number}`);
    console.log(`========================================`);

    const numStr = item.number.replace(/[^0-9]/g, '');

    const chunks = [
      {
        section: 'core_essence',
        indicator_type: 'core',
        title: `[${item.number}] Bản chất Cốt lõi & Sứ mệnh Đời sống`,
        content: item.core_essence,
        key_concepts: [item.number, `số ${numStr}`, 'bản chất', 'mục đích sống'],
      },
      {
        section: 'strengths',
        indicator_type: 'strengths',
        title: `[${item.number}] Năng lực Nổi trội & Điểm mạnh Bẩm sinh`,
        content: item.strengths_and_talents,
        key_concepts: [item.number, `số ${numStr}`, 'điểm mạnh', 'tài năng'],
      },
      {
        section: 'weaknesses',
        indicator_type: 'weaknesses',
        title: `[${item.number}] Cạm bẫy Tâm lý, Điểm yếu & Bài học Phát triển`,
        content: item.weaknesses_and_lessons,
        key_concepts: [item.number, `số ${numStr}`, 'điểm yếu', 'cạm bẫy', 'bài học'],
      },
      {
        section: 'career',
        indicator_type: 'career',
        title: `[${item.number}] Định hướng Nghề nghiệp & Môi trường Làm việc`,
        content: item.career_and_life_path,
        key_concepts: [item.number, `số ${numStr}`, 'nghề nghiệp', 'công việc', 'sự nghiệp'],
      },
      {
        section: 'relationship',
        indicator_type: 'relationship',
        title: `[${item.number}] Phong cách Tình cảm, Hôn nhân & Ứng xử`,
        content: item.relationship_and_behavior,
        key_concepts: [item.number, `số ${numStr}`, 'tình cảm', 'hôn nhân', 'mối quan hệ'],
      },
    ];

    for (const chunk of chunks) {
      const textToEmbed = `Title: ${chunk.title}\nContent: ${chunk.content}\nKeywords: ${chunk.key_concepts.join(', ')}`;
      const embedding = await getJinaEmbedding(textToEmbed, 'retrieval.passage');
      await insertToSupabase({
        number_tag: item.number,
        indicator_type: chunk.indicator_type,
        section: chunk.section,
        title: chunk.title,
        content: chunk.content,
        key_concepts: chunk.key_concepts,
        embedding,
      });
    }

    if (item.qa_pair && item.qa_pair.question && item.qa_pair.answer) {
      const qaTitle = `[${item.number}] Tháo Gỡ Nút Thắt Bản Thân`;
      const qaContent = `Hỏi: ${item.qa_pair.question}\nĐáp: ${item.qa_pair.answer}`;
      const textToEmbed = `Title: ${qaTitle}\n${qaContent}`;
      const embedding = await getJinaEmbedding(textToEmbed, 'retrieval.passage');
      await insertToSupabase({
        number_tag: item.number,
        indicator_type: 'qa',
        section: 'qa',
        title: qaTitle,
        content: qaContent,
        key_concepts: [item.number, `số ${numStr}`, 'hỏi đáp', 'gỡ rối'],
        embedding,
      });
    }
  }

  console.log('\n🎉 Successfully ingested all knowledge into Supabase pgvector with Jina AI Embeddings!');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Supabase Ingestion failed:', err);
    process.exit(1);
  });
}
