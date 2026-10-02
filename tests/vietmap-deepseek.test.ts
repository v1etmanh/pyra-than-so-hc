import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findVietMapPlaces, formatPlaceReply } from '../lib/places/vietmap-deepseek.ts';

test('DeepSeek plans and ranks only factual VietMap candidates', async () => {
  const envNames = ['DEEPSEEK_API_KEY', 'DEEPSEEK_API_BASE_URL', 'DEEPSEEK_MODEL', 'VIETMAP_API_KEY'];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const deepSeekBodies: Array<Record<string, unknown>> = [];
  const vietMapUrls: URL[] = [];
  let deepSeekCall = 0;

  try {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.VIETMAP_API_KEY = 'test-vietmap-key';
    process.env.DEEPSEEK_API_BASE_URL = 'https://deepseek.test';
    process.env.DEEPSEEK_MODEL = 'test-deepseek-model';

    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      if (url.hostname === 'deepseek.test') {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        deepSeekBodies.push(body);
        deepSeekCall += 1;
        const content = deepSeekCall === 1
          ? JSON.stringify({ searchQuery: 'cà phê yên tĩnh' })
          : JSON.stringify({
            selectedIndexes: [1, 0],
            placeReasons: [
              { index: 1, reason: 'Phù hợp một cuộc trò chuyện nhẹ nhàng và tập trung.' },
              { index: 0, reason: 'Là lựa chọn gần để bạn bắt đầu buổi gặp gỡ thoải mái.' },
            ],
            summary: 'Lá Ẩn Sĩ và Số Đường Đời 7 gợi một cuộc gặp chậm rãi để lắng nghe nhau.',
            nextStep: 'Chọn nơi thuận đường nhất và kiểm tra giờ mở cửa trước khi đi.',
          });
        return new Response(JSON.stringify({ choices: [{ message: { content } }] }));
      }

      if (url.hostname === 'maps.vietmap.vn') {
        vietMapUrls.push(url);
        return new Response(JSON.stringify([
          { ref_id: 'poi:1', name: 'Quán A', address: '1 Đường A', distance: 0.8, categories: ['cafe'] },
          { ref_id: 'poi:2', name: 'Quán B', address: '2 Đường B', distance: 1.2, categories: ['cafe'] },
          { ref_id: 'poi:3', name: 'Quán Xa', address: '3 Đường C', distance: 9, categories: ['cafe'] },
        ]));
      }

      throw new Error(`Unexpected request: ${url}`);
    };

    const result = await findVietMapPlaces({
      message: 'Tối nay đi đâu uống cà phê với bạn?',
      context: {
        latitude: 10.7769,
        longitude: 106.7009,
        maxDistanceKm: 5,
        budget: 'medium',
        companion: 'friends',
        openNow: false,
      },
      spiritualContext: {
        tarotCards: [{
          name: 'The Hermit',
          orientation: 'upright',
          position: 'Thông điệp',
          meaning: 'Chiêm nghiệm, tĩnh lặng và lắng nghe nội tâm.',
        }],
        indicators: [{
          key: 'walksOfLife',
          name: 'Số Đường Đời',
          value: 7,
          summary: 'Số 7 phù hợp đào sâu, quan sát và không gian yên tĩnh.',
        }],
      },
    });

    assert.equal(result.searchQuery, 'cà phê yên tĩnh');
    assert.doesNotMatch(result.searchQuery, /tarot|thần số học|numerology/i);
    assert.deepEqual(result.places.map((place) => place.name), ['Quán B', 'Quán A']);
    assert.equal(result.places.some((place) => place.name === 'Quán Xa'), false);
    assert.equal(result.placeReasons[0]?.placeId, 'poi:2');
    assert.match(result.placeReasons[0]?.reason || '', /trò chuyện/);
    assert.match(result.summary, /Số Đường Đời 7/);
    assert.match(result.nextStep, /giờ mở cửa/);

    const reply = formatPlaceReply(result);
    assert.match(reply, /^✦ KẾT LUẬN NHANH:/);
    assert.match(reply, /✦ VÌ SAO:/);
    assert.match(reply, /✦ NÊN LÀM GÌ:/);
    assert.match(reply, /Quán B: Phù hợp một cuộc trò chuyện/);

    assert.equal(vietMapUrls.length, 1);
    assert.equal(vietMapUrls[0]?.pathname, '/api/autocomplete/v4');
    assert.equal(vietMapUrls[0]?.searchParams.get('text'), 'cà phê yên tĩnh');
    assert.equal(vietMapUrls[0]?.searchParams.get('focus'), '10.7769,106.7009');
    assert.equal(vietMapUrls[0]?.searchParams.get('circle_center'), '10.7769,106.7009');
    assert.equal(vietMapUrls[0]?.searchParams.get('circle_radius'), '5000');
    assert.equal(vietMapUrls[0]?.searchParams.get('layers'), 'POI');
    assert.equal(vietMapUrls[0]?.searchParams.get('apikey'), 'test-vietmap-key');

    assert.equal(deepSeekBodies.length, 2);
    for (const payload of deepSeekBodies) {
      assert.match(JSON.stringify(payload), /NGỮ CẢNH THỜI GIAN HIỆN TẠI/);
    }
    assert.equal(String(deepSeekBodies[0]?.model), 'test-deepseek-model');
    assert.deepEqual(deepSeekBodies[0]?.response_format, { type: 'json_object' });
    const deepSeekPayloads = JSON.stringify(deepSeekBodies);
    assert.match(deepSeekPayloads, /The Hermit/);
    assert.match(deepSeekPayloads, /Số Đường Đời/);
    assert.equal(deepSeekPayloads.includes('10.7769'), false);
    assert.equal(deepSeekPayloads.includes('1990-01-01'), false);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('invalid DeepSeek ranking keeps only verified VietMap candidates with neutral fallback copy', async () => {
  const envNames = ['DEEPSEEK_API_KEY', 'DEEPSEEK_API_BASE_URL', 'DEEPSEEK_MODEL', 'VIETMAP_API_KEY'];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  let deepSeekCall = 0;

  try {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.VIETMAP_API_KEY = 'test-vietmap-key';
    process.env.DEEPSEEK_API_BASE_URL = 'https://deepseek.test';

    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      if (url.hostname === 'deepseek.test') {
        deepSeekCall += 1;
        const content = deepSeekCall === 1
          ? JSON.stringify({ searchQuery: 'công viên đi dạo' })
          : JSON.stringify({
            selectedIndexes: [99, -1],
            placeReasons: [{ index: 99, reason: 'Địa điểm không có thật.' }],
            summary: 42,
            nextStep: null,
          });
        return new Response(JSON.stringify({ choices: [{ message: { content } }] }));
      }

      if (url.hostname === 'maps.vietmap.vn') {
        return new Response(JSON.stringify([
          { ref_id: 'poi:1', name: 'Công viên A', address: 'Địa chỉ A', distance: 0.4, categories: ['park'] },
          { ref_id: 'poi:2', name: 'Công viên B', address: 'Địa chỉ B', distance: 0.8, categories: ['park'] },
        ]));
      }

      throw new Error(`Unexpected request: ${url}`);
    };

    const result = await findVietMapPlaces({
      message: 'Muốn đi dạo gần đây',
      context: { latitude: 10.7, longitude: 106.6, maxDistanceKm: 5, budget: 'medium', companion: 'solo', openNow: false },
    });

    assert.deepEqual(result.places.map((place) => place.name), ['Công viên A', 'Công viên B']);
    assert.deepEqual(result.placeReasons, []);
    assert.equal(result.summary, '');
    assert.equal(result.nextStep, '');
    const reply = formatPlaceReply(result);
    assert.match(reply, /Công viên A: Được DeepSeek xếp hạng từ các kết quả đã xác thực của VietMap/);
    assert.doesNotMatch(reply, /Địa điểm không có thật/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('an open where-to-go question searches distinct place types instead of only cafes', async () => {
  const envNames = ['DEEPSEEK_API_KEY', 'DEEPSEEK_API_BASE_URL', 'DEEPSEEK_MODEL', 'VIETMAP_API_KEY'];
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const searched: string[] = [];
  let deepSeekCall = 0;

  try {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.VIETMAP_API_KEY = 'test-vietmap-key';
    process.env.DEEPSEEK_API_BASE_URL = 'https://deepseek.test';
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      if (url.hostname === 'deepseek.test') {
        deepSeekCall++;
        const content = deepSeekCall === 1
          ? JSON.stringify({ searchQueries: ['quán cà phê yên tĩnh', 'cafe gần đây', 'coffee shop'] })
          : JSON.stringify({ selectedIndexes: [0, 1, 2], placeReasons: [], summary: 'Có ba hướng đi gần bạn.', nextStep: 'Kiểm tra giờ mở cửa trước khi đi.' });
        return new Response(JSON.stringify({ choices: [{ message: { content } }] }));
      }
      if (url.hostname === 'maps.vietmap.vn') {
        const query = url.searchParams.get('text') || '';
        searched.push(query);
        return new Response(JSON.stringify([{
          ref_id: `poi:${query}`, name: `Nơi ${query}`, address: 'Địa chỉ đã xác thực', distance: 0.5,
          categories: [query],
        }]));
      }
      throw new Error(`Unexpected request: ${url}`);
    };

    const result = await findVietMapPlaces({
      message: 'nên đi đâu giờ này nhỉ',
      context: { latitude: 10.7, longitude: 106.6, maxDistanceKm: 5, budget: 'medium', companion: 'solo', openNow: true },
    });

    assert.equal(searched.length, 3);
    assert.equal(searched.filter((query) => /cà phê|cafe|coffee/i.test(query)).length, 1);
    assert.ok(searched.some((query) => /công viên/i.test(query)));
    assert.ok(searched.some((query) => /nhà sách/i.test(query)));
    assert.equal(result.places.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = originalEnv.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
