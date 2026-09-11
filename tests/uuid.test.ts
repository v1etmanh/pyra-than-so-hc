import test from 'node:test';
import assert from 'node:assert/strict';
import { generateUUID } from '../lib/uuid.ts';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('generateUUID generates valid UUID v4 format by default', () => {
  const id1 = generateUUID();
  const id2 = generateUUID();

  assert.match(id1, UUID_V4_REGEX);
  assert.match(id2, UUID_V4_REGEX);
  assert.notEqual(id1, id2);
});

test('generateUUID falls back gracefully when crypto.randomUUID is not a function', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const originalCrypto = globalThis.crypto;

  try {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto)
      },
      configurable: true,
      writable: true
    });

    const id = generateUUID();
    assert.match(id, UUID_V4_REGEX);
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalDescriptor);
    }
  }
});

test('generateUUID falls back gracefully when crypto is undefined', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  try {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true
    });

    const id = generateUUID();
    assert.match(id, UUID_V4_REGEX);
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalDescriptor);
    }
  }
});
