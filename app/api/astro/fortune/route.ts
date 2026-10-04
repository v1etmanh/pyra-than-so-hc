import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import {
  astroFortuneRequestSchema,
  generateAstroFortune,
  type AstroFortuneInput,
} from '@/lib/astro/fortune-service';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function jsonError(message: string, status = 400, code = 'INVALID_REQUEST') {
  return jsonResponse({ error: message, code }, status);
}

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await readJsonBody(req, 64 * 1024);
    } catch (error) {
      const limited = requestLimitResponse(error);
      if (limited) return limited;
      return jsonError('Invalid JSON request body', 400);
    }

    let input: AstroFortuneInput;
    try {
      input = astroFortuneRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError(error.issues.map((i) => i.message).join(', '), 422);
      }
      return jsonError('Request validation failed', 422);
    }

    const fortune = await generateAstroFortune(input);

    return jsonResponse({
      success: true,
      fortune,
      sampleAnchor: {
        caDaoSample: input.caDaoSample,
        caDaoCategory: input.caDaoCategory || null,
      },
    });
  } catch (error) {
    console.error('[Astro Fortune API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return jsonError(message, 500, 'AI_GENERATION_FAILED');
  }
}
