import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildIndicatorKnowledgeFallback,
  createIndicatorFallbackStream
// @ts-expect-error Node's type-stripping test runner needs the explicit extension.
} from '../app/api/numerology/lazy-indicator/fallback.ts';

const encoder = new TextEncoder();

function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    }
  });
}

function streamThatFails(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.error(new Error('provider disconnected'));
    }
  });
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return output;
      output += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

test('fallback keeps the knowledge article intact and personalizes its introduction', () => {
  const article = '# Số Đường Đời 7\n\nNội dung nguyên văn.';
  const fallback = buildIndicatorKnowledgeFallback({
    fullName: 'Lê Viết Mạnh',
    indicatorName: 'Số Đường Đời',
    indicatorValue: 7,
    language: 'Vietnamese',
    knowledgeRecord: { content: article }
  });

  assert.ok(fallback);
  assert.match(fallback, /Lê Viết Mạnh/);
  assert.match(fallback, /Số Đường Đời 7/);
  assert.ok(fallback.endsWith(article));
});

test('fallback uses English default name when the name is missing', () => {
  const fallback = buildIndicatorKnowledgeFallback({
    indicatorName: 'Life Path',
    indicatorValue: 7,
    language: 'English',
    knowledgeRecord: { content: 'Original knowledge.' }
  });

  assert.match(fallback || '', /\*\*you\*\*/);
});

test('empty AI stream emits a knowledge fallback event', async () => {
  const output = await readStream(
    createIndicatorFallbackStream(
      streamFromChunks(['data: {"done":true}\n\n']),
      'Personalized knowledge fallback.'
    )
  );

  assert.match(output, /"type":"fallback"/);
  assert.match(output, /Personalized knowledge fallback\./);
});

test('provider warning after partial output is replaced without forwarding the warning', async () => {
  const output = await readStream(
    createIndicatorFallbackStream(
      streamFromChunks([
        'data: {"content":"Partial answer"}\n\n',
        'data: {"content":"\\n\\n⚠️ Không thể kết nối các nhà cung cấp AI."}\n\n',
        'data: {"done":true}\n\n'
      ]),
      'Complete knowledge fallback.'
    )
  );

  assert.match(output, /Partial answer/);
  assert.match(output, /Complete knowledge fallback\./);
  assert.doesNotMatch(output, /Không thể kết nối các nhà cung cấp AI/);
});

test('any warning-only AI event is replaced by knowledge fallback', async () => {
  const output = await readStream(
    createIndicatorFallbackStream(
      streamFromChunks(['data: {"content":"⚠️ AI không thể hoàn tất."}\n\n']),
      'Warning-safe knowledge fallback.'
    )
  );

  assert.match(output, /Warning-safe knowledge fallback\./);
  assert.doesNotMatch(output, /AI không thể hoàn tất/);
});

test('stream read failure emits fallback instead of failing the response', async () => {
  const output = await readStream(
    createIndicatorFallbackStream(streamThatFails(), 'Network-safe fallback.')
  );

  assert.match(output, /Network-safe fallback\./);
});

test('successful AI stream remains unchanged', async () => {
  const output = await readStream(
    createIndicatorFallbackStream(
      streamFromChunks(['data: {"content":"AI answer"}\n\n', 'data: {"done":true}\n\n']),
      'Should not be used.'
    )
  );

  assert.match(output, /AI answer/);
  assert.doesNotMatch(output, /fallback/);
});
