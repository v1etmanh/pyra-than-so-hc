import { findVietMapPlaces } from '../lib/places/vietmap-deepseek.ts';

/**
 * Live smoke test for the production where_to_go pipeline.
 * The package script loads only `.env`; `.env.local` is intentionally ignored.
 */
function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

const latitude = numberFromEnv('VIETMAP_TEST_LATITUDE', 10.7769);
const longitude = numberFromEnv('VIETMAP_TEST_LONGITUDE', 106.7009);
const message = process.env.VIETMAP_TEST_QUERY?.trim() || 'Tìm quán cà phê yên tĩnh để trò chuyện với bạn';

const summary = {
  deepSeekConfigured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
  vietMapConfigured: Boolean(process.env.VIETMAP_API_KEY?.trim()),
  deepSeekModel: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
  coordinatesValid: latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180,
  customQuery: Boolean(process.env.VIETMAP_TEST_QUERY?.trim()),
  customLocation: Boolean(process.env.VIETMAP_TEST_LATITUDE || process.env.VIETMAP_TEST_LONGITUDE),
};

console.info('[VietMap + DeepSeek smoke test] configuration:', summary);

if (!summary.deepSeekConfigured || !summary.vietMapConfigured) {
  console.error('[VietMap + DeepSeek smoke test] DEEPSEEK_API_KEY and VIETMAP_API_KEY are both required in .env.');
  process.exitCode = 1;
} else if (!summary.coordinatesValid) {
  console.error('[VietMap + DeepSeek smoke test] Test coordinates are invalid.');
  process.exitCode = 1;
} else {
  try {
    const result = await findVietMapPlaces({
      message,
      context: {
        latitude,
        longitude,
        maxDistanceKm: 5,
        budget: 'medium',
        companion: 'friends',
        openNow: false,
      },
    });

    console.info('[VietMap + DeepSeek smoke test] result:', {
      searchQuery: result.searchQuery,
      summary: result.summary,
      nextStep: result.nextStep,
      placeCount: result.places.length,
      places: result.places.map((place) => ({
        name: place.name,
        address: place.address,
        distanceKm: place.distanceKm,
      })),
    });

    if (result.places.length === 0) {
      console.error('[VietMap + DeepSeek smoke test] VietMap returned no usable places.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      '[VietMap + DeepSeek smoke test] failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exitCode = 1;
  }
}
