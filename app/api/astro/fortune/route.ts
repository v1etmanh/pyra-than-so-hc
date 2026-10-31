import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import {
  astroFortuneRequestSchema,
  generateAstroFortuneDetailed,
  type AstroFortuneInput,
} from '@/lib/astro/fortune-service';
import { getRequestAccess, releaseRequestAccess, type RequestAccess } from '@/lib/billing/access';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiCorsHeaders } from '@/lib/security/cors';
import { calculateAiCostUsd } from '@/lib/usage/ai-cost';
import {
  getQuotaSnapshot,
  recordActualAiUsage,
  recordUnmeteredAiUsage,
  resolveUserQuotaContext,
} from '@/lib/usage/quota-service';
import {
  claimDailyContent,
  commitDailyContent,
  completeDailyContent,
  readDailyContent,
  releaseDailyContentClaim,
  waitForLocalizedDailyContent,
} from '@/lib/usage/daily-content';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: apiCorsHeaders(request) });
}

async function readFortuneQuota(
  context: NonNullable<Awaited<ReturnType<typeof resolveUserQuotaContext>>>,
  localDate: string,
) {
  const snapshot = await getQuotaSnapshot(context.userId, context.plan, context.period);
  return {
    ...snapshot.daily_ca_dao,
    localDate,
    periodStart: context.period.start.toISOString(),
    periodEnd: context.period.end.toISOString(),
  };
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

export async function GET(req: NextRequest) {
  try {
    const localDate = req.nextUrl.searchParams.get('localDate')?.trim() || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      return jsonError(req, 'localDate is required.', 422);
    }
    const context = await resolveUserQuotaContext(req);
    if (!context) return jsonError(req, 'Authentication is required.', 401, 'AUTH_REQUIRED');
    const quota = await readFortuneQuota(context, localDate);
    return jsonResponse(req, { quota });
  } catch (error) {
    console.error('[Astro Fortune Quota API Error]:', error);
    return jsonError(req, 'Could not load Daily Fortune quota.', 500, 'QUOTA_UNAVAILABLE');
  }
}

export async function POST(req: NextRequest) {
  let contentClaim: Awaited<ReturnType<typeof claimDailyContent>> | null = null;
  let access: RequestAccess | null = null;
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

    const context = await resolveUserQuotaContext(req);
    if (!context) return jsonError(req, 'Bạn cần đăng nhập để mở ca dao hôm nay.', 401, 'AUTH_REQUIRED');
    admin = createAdminClient();
    const contentKey = { userId: context.userId, profileKey, localDate, contentType: 'daily_ca_dao' as const };
    const cached = await readDailyContent(admin, contentKey, locale);
    if (cached) {
      const quota = await readFortuneQuota(context, localDate);
      return jsonResponse(req, { ...cached, cached: true, quota });
    }

    let input: AstroFortuneInput;
    try {
      input = astroFortuneRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError(req, error.issues.map((i) => i.message).join(', '), 422);
      }
      return jsonError(req, 'Request validation failed', 422);
    }

    contentClaim = await claimDailyContent(admin, contentKey, locale);
    if (contentClaim.state === 'cached') {
      const quota = await readFortuneQuota(context, localDate);
      return jsonResponse(req, { ...contentClaim.content, cached: true, quota });
    }
    if (contentClaim.state === 'limit_reached') {
      return jsonResponse(req, {
        error: locale === 'en' ? 'Daily Fortune quota reached.' : 'Bạn đã dùng hết lượt Daily Fortune trong kỳ này.',
        code: 'MONTHLY_LIMIT_REACHED',
      }, 429);
    }
    if (contentClaim.state === 'pending') {
      const completed = await waitForLocalizedDailyContent(admin, contentKey, locale);
      if (completed) {
        const quota = await readFortuneQuota(context, localDate);
        return jsonResponse(req, { ...completed, cached: true, quota });
      }
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

    // A second locale reuses the same profile/day allocation. Only a new base
    // Daily Fortune consumes the monthly quota.
    if (contentClaim.claimKind !== 'localization') {
      const quotaAccess = await getRequestAccess(req, 'daily_ca_dao', requestId);
      if (quotaAccess instanceof Response) {
        await releaseDailyContentClaim(admin, contentClaim);
        contentClaim = null;
        for (const [key, value] of Object.entries(apiCorsHeaders(req))) quotaAccess.headers.set(key, value);
        return quotaAccess;
      }
      access = quotaAccess;
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
    const usage = {
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
    };
    if (access) {
      await commitDailyContent(admin, contentClaim, access, payload, { route: usage.route, profileKey, localDate });
      await recordActualAiUsage({ reservation: access, ...usage });
    } else {
      await completeDailyContent(admin, contentClaim, payload);
      await recordUnmeteredAiUsage({ userId: context.userId, feature: 'daily_ca_dao_localization', ...usage });
    }
    const quota = await readFortuneQuota(context, localDate);
    return jsonResponse(req, { ...payload, cached: false, quota });
  } catch (error) {
    if (access) await releaseRequestAccess(access, 'daily_fortune_generation_failed');
    if (admin && contentClaim?.state === 'claimed') await releaseDailyContentClaim(admin, contentClaim);
    console.error('[Astro Fortune API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return jsonError(req, message, 500, 'AI_GENERATION_FAILED');
  }
}
