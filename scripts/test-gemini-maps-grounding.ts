import { findGeminiMapsPlaces } from '../lib/places/gemini-maps-grounding.ts';

/**
 * A live smoke test for the same Maps Grounding helper used by /api/chat/agent.
 *
 * It deliberately reads only GEMINI_MAPS_API_KEYS. Run it with `.env` so an
 * empty `.env.local` cannot hide a working Maps key while diagnosing the API.
 * No API key or precise user location is written to stdout.
 */

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

const query = process.env.MAPS_TEST_QUERY?.trim() || 'Tìm quán cà phê yên tĩnh gần đây';
const latitude = numberFromEnv('MAPS_TEST_LATITUDE', 10.7769);
const longitude = numberFromEnv('MAPS_TEST_LONGITUDE', 106.7009);
const maxDistanceKm = numberFromEnv('MAPS_TEST_MAX_DISTANCE_KM', 5);

const mapsKeys = (process.env.GEMINI_MAPS_API_KEYS || '')
  .split(',')
  .map((key) => key.trim())
  .filter(Boolean);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Control probe with a fixed, non-user prompt. Built-in Google Maps cannot use
 * function-calling `tool_choice`, so this captures the model's explanation if
 * it declines to call Maps rather than exposing any user request text.
 */
async function mapsControlProbe(apiKey: string) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: process.env.GEMINI_MAPS_MODEL?.trim() || 'gemini-2.5-flash',
      input: 'You must use the Google Maps tool now. Find up to five real cafes near the supplied location and cite every place from Google Maps. Do not answer from general knowledge.',
      tools: [{ type: 'google_maps', latitude, longitude }],
    }),
  });
  const payload: unknown = await response.json().catch(() => null);
  const steps = isRecord(payload) && Array.isArray(payload.steps) ? payload.steps : [];
  let placeCitations = 0;
  let responsePreview = '';

  for (const step of steps) {
    if (!isRecord(step) || !Array.isArray(step.content)) continue;
    for (const content of step.content) {
      if (!responsePreview && isRecord(content) && typeof content.text === 'string') {
        responsePreview = content.text.replace(/\s+/g, ' ').trim().slice(0, 240);
      }
      if (!isRecord(content) || !Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations) {
        if (isRecord(annotation) && annotation.type === 'place_citation') placeCitations += 1;
      }
    }
  }

  return {
    status: response.status,
    mapsToolCalled: steps.some((step) => isRecord(step) && step.type === 'google_maps_call'),
    mapsToolReturnedResults: steps.some((step) => isRecord(step) && step.type === 'google_maps_result'),
    placeCitations,
    responsePreview,
    apiError: isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string'
      ? payload.error.message.replace(/[\r\n]+/g, ' ').slice(0, 180)
      : null,
  };
}

if (mapsKeys.length === 0) {
  console.error('[Maps Grounding smoke test] GEMINI_MAPS_API_KEYS is missing or empty.');
  process.exitCode = 1;
} else {
  let productionHelperPassed = false;
  console.info('[Maps Grounding smoke test] starting:', {
    mapsKeyConfigured: true,
    keyCount: mapsKeys.length,
    model: process.env.GEMINI_MAPS_MODEL?.trim() || 'gemini-2.5-flash',
    locationValid: latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180,
    maxDistanceKm,
    customQuery: Boolean(process.env.MAPS_TEST_QUERY?.trim()),
    customLocation: Boolean(process.env.MAPS_TEST_LATITUDE || process.env.MAPS_TEST_LONGITUDE),
  });

  try {
    const places = await findGeminiMapsPlaces({
      message: query,
      context: {
        latitude,
        longitude,
        maxDistanceKm,
        budget: 'medium',
        companion: 'solo',
        openNow: false,
      },
    });

    console.info('[Maps Grounding smoke test] finished:', {
      citedPlaceCount: places.length,
      citedPlaceNames: places.map((place) => place.name),
    });

    if (places.length === 0) {
      console.error('[Maps Grounding smoke test] No Google Maps citations were returned.');
      process.exitCode = 1;
    } else {
      productionHelperPassed = true;
    }
  } catch (error) {
    console.error(
      '[Maps Grounding smoke test] production-helper result:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exitCode = 1;
  }

  try {
    const controlProbe = await mapsControlProbe(mapsKeys[0]);
    console.info('[Maps Grounding smoke test] Maps control:', controlProbe);

    if (controlProbe.status !== 200 || !controlProbe.mapsToolCalled || controlProbe.placeCitations === 0) {
      console.warn('[Maps Grounding smoke test] The optional control did not return Maps citations; built-in tool selection is model-dependent.');
    }
  } catch (error) {
    console.error(
      '[Maps Grounding smoke test] Maps control failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    if (!productionHelperPassed) process.exitCode = 1;
  }
}
