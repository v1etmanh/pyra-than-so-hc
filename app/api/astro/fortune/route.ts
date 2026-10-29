import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import {
  astroFortuneRequestSchema,
  generateAstroFortuneDetailed,
  type AstroFortuneInput,
} from '@/lib/astro/fortune-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestAuth } from '@/lib/supabase/request-auth';
import { apiCorsHeaders } from '@/lib/security/cors';
import { calculateAiCostUsd } from '@/lib/usage/ai-cost';
import { recordUnmeteredAiUsage } from '@/lib/usage/quota-service';
import {
  claimDailyContent,
  completeDailyContent,
  readDailyContent,
  releaseDailyContentClaim,
  waitForLocalizedDailyContent,
} from '@/lib/usage/daily-content';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const DAILY_FORTUNE_PROFILE_LIMIT = 3;

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: apiCorsHeaders(request) });
}

function jsonResponse(request: Request, data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...apiCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

function jsonError(request: Request, message: string, status = 400, code = 'INVALID_REQUEST') {
  return jsonResponse(request, { error: message, code }, status);
}

export async function POST(req: NextRequest) {
  let contentClaim: Awaited<ReturnType<typeof claimDailyContent>> | null = null;
  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    let rawBody: unknown;
    try {
      rawBody = await readJsonBody(req, 64 * 1024);
    } catch (error) {
      const limited = requestLimitResponse(error);
      if (limited) return limited;
      return jsonError(req, 'Invalid JSON request body', 400);
    }

    const rawRecord = rawBody && typeof rawBody === 'object' ? rawBody as Record<string, unknown> : {};
    const profileKey = typeof rawRecord.profileKey === 'string' ? rawRecord.profileKey.trim() : '';
    const localDate = typeof rawRecord.localDate === 'string' ? rawRecord.localDate.trim() : '';
    const requestId = typeof rawRecord.requestId === 'string' ? rawRecord.requestId.trim() : '';
    const locale = rawRecord.locale === 'en' ? 'en' : 'vi';
    if (!profileKey || profileKey.length > 160 || !/^\d{4}-\d{2}-\d{2}$/.test(localDate) || requestId.length < 8) {
      return jsonError(req, 'profileKey, localDate and requestId are required.', 422);
    }

    const { user } = await getRequestAuth(req);
    if (!user) return jsonError(req, 'Bạn cần đăng nhập để mở ca dao hôm nay.', 401, 'AUTH_REQUIRED');
    admin = createAdminClient();
    const contentKey = { userId: user.id, profileKey, localDate, contentType: 'daily_ca_dao' as const };
    const cached = await readDailyContent(admin, contentKey, locale);
    if (cached) return jsonResponse(req, { ...cached, cached: true });

    let input: AstroFortuneInput;
    try {
      input = astroFortuneRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError(req, error.issues.map((i) => i.message).join(', '), 422);
      }
      return jsonError(req, 'Request validation failed', 422);
    }

    contentClaim = await claimDailyContent(admin, contentKey, locale, DAILY_FORTUNE_PROFILE_LIMIT);
    if (contentClaim.state === 'cached') return jsonResponse(req, { ...contentClaim.content, cached: true });
    if (contentClaim.state === 'limit_reached') {
      return jsonResponse(req, {
        error: locale === 'en'
          ? 'You have already created Daily Fortune for 3 profiles today.'
          : 'Bạn đã tạo Daily Fortune cho đủ 3 hồ sơ hôm nay.',
        code: 'DAILY_PROFILE_LIMIT_REACHED',
        limit: contentClaim.limit,
        used: contentClaim.used,
        remaining: 0,
        localDate,
      }, 429);
    }
    if (contentClaim.state === 'pending') {
      const completed = await waitForLocalizedDailyContent(admin, contentKey, locale);
      if (completed) return jsonResponse(req, { ...completed, cached: true });
      return jsonError(req, 'Ca dao hôm nay đang được tạo. Vui lòng thử lại sau.', 409, 'CONTENT_PENDING');
    }

    // A localization is another rendering of the same profile/day record. It
    // must reuse the original ca-dao anchor instead of accepting the newly
    // selected client sample.
    if (contentClaim.claimKind === 'localization' && contentClaim.anchor?.caDaoSample) {
      input = {
        ...input,
        caDaoSample: contentClaim.anchor.caDaoSample,
        caDaoCategory: contentClaim.anchor.caDaoCategory || undefined,
      };
    }

    const generation = await generateAstroFortuneDetailed(input);
    const fortune = generation.fortune;
    const payload = {
      success: true,
      fortune,
      sampleAnchor: {
        caDaoSample: input.caDaoSample,
        caDaoCategory: input.caDaoCategory || null,
      },
    };
    await completeDailyContent(admin, contentClaim, payload);
    await recordUnmeteredAiUsage({
      userId: user.id,
      feature: 'daily_ca_dao',
      route: '/api/astro/fortune',
      provider: generation.provider,
      model: generation.model,
      inputTokens: generation.usage?.inputTokens,
      outputTokens: generation.usage?.outputTokens,
      costUsd: calculateAiCostUsd({
        provider: generation.provider,
        model: generation.model,
        inputTokens: generation.usage?.inputTokens,
        outputTokens: generation.usage?.outputTokens,
      }),
    });
    return jsonResponse(req, { ...payload, cached: false });
  } catch (error) {
    if (admin && contentClaim?.state === 'claimed') await releaseDailyContentClaim(admin, contentClaim);
    console.error('[Astro Fortune API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return jsonError(req, message, 500, 'AI_GENERATION_FAILED');
  }
}
