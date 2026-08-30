// -*- coding: utf-8 -*-
import * as fs from 'fs';
import * as path from 'path';

export interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  engine?: 'auto' | 'cloudflare' | 'pollinations';
  model?: string;
  saveToDisk?: boolean;
}

export interface ImageGenerationResult {
  imageUrl: string;
  seed: number;
  provider: 'cloudflare' | 'pollinations' | 'local';
  model: string;
  width: number;
  height: number;
  localPath?: string;
}

/**
 * Generate image using Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)
 */
export async function generateViaCloudflare(
  prompt: string,
  modelName?: string,
  timeoutMs: number = 20000,
  seed: number = Math.floor(Math.random() * 10000000),
  width: number = 720,
  height: number = 1280
): Promise<{ imageUrl: string; model: string; buffer?: Buffer } | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const targetModel = modelName || process.env.CLOUDFLARE_IMAGE_MODEL?.trim() || '@cf/black-forest-labs/flux-1-schnell';

  if (!accountId || !apiToken) {
    console.warn('[Cloudflare AI] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in environment');
    return null;
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${targetModel}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const body: Record<string, any> = {
      prompt: prompt.trim(),
    };

    if (targetModel.includes('flux-1-schnell')) {
      body.steps = 4;
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn(`[Cloudflare AI] HTTP ${resp.status}:`, errText);
      return null;
    }

    const data = await resp.json();
    const base64Data: string | undefined = data?.result?.image || data?.image;

    if (!base64Data) {
      console.warn('[Cloudflare AI] No image data returned in response:', data);
      return null;
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Save image to public directory for persistent fast delivery
    try {
      const publicDir = path.resolve(process.cwd(), 'public', 'images', 'lucky-wallpapers');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const filename = `lucky_cf_${seed}_${width}x${height}.jpg`;
      const filePath = path.join(publicDir, filename);
      fs.writeFileSync(filePath, imageBuffer);

      return {
        imageUrl: `/images/lucky-wallpapers/${filename}`,
        model: targetModel,
        buffer: imageBuffer,
      };
    } catch (saveErr) {
      console.warn('[Cloudflare AI] Failed to save image to disk, using data URL fallback:', saveErr);
      return {
        imageUrl: `data:image/jpeg;base64,${base64Data}`,
        model: targetModel,
        buffer: imageBuffer,
      };
    }
  } catch (err) {
    console.warn('[Cloudflare AI] Generation request failed:', err);
    return null;
  }
}

/**
 * Generate Pollinations.ai FLUX direct URL
 */
export function getPollinationsUrl(
  prompt: string,
  width: number = 720,
  height: number = 1280,
  seed: number = Math.floor(Math.random() * 10000000)
): string {
  const encodedPrompt = encodeURIComponent(prompt.trim());
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
}

/**
 * Main Wallpaper Generation Function:
 * 1. Primary: Cloudflare Workers AI (FLUX-1-schnell)
 * 2. Fallback: Pollinations.ai (FLUX)
 */
export async function generateWallpaperImage(
  options: GenerateImageOptions
): Promise<ImageGenerationResult> {
  const width = options.width || 720;
  const height = options.height || 1280;
  const seed = options.seed || Math.floor(Math.random() * 10000000);
  const prompt = options.prompt;
  const engine = options.engine || 'auto';

  // 1. Try Cloudflare Workers AI if engine is 'auto' or 'cloudflare'
  if (engine === 'auto' || engine === 'cloudflare') {
    try {
      const cfRes = await generateViaCloudflare(
        prompt,
        options.model,
        22000,
        seed,
        width,
        height
      );
      if (cfRes && cfRes.imageUrl) {
        console.log(`[Wallpaper Generator] Successfully generated via Cloudflare Workers AI (${cfRes.model})`);
        return {
          imageUrl: cfRes.imageUrl,
          seed,
          provider: 'cloudflare',
          model: cfRes.model,
          width,
          height,
          localPath: cfRes.imageUrl.startsWith('/') ? cfRes.imageUrl : undefined,
        };
      }
    } catch (err) {
      console.warn('[Wallpaper Generator] Cloudflare failed, falling back to Pollinations:', err);
    }
  }

  // 2. Fallback to Pollinations FLUX
  console.log('[Wallpaper Generator] Using Fallback Engine: Pollinations.ai FLUX');
  const directUrl = getPollinationsUrl(prompt, width, height, seed);

  // If server-side saving is requested, download the image and save to public directory
  if (options.saveToDisk) {
    try {
      const resp = await fetch(directUrl, {
        signal: AbortSignal.timeout(30000),
      });

      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length >= 5000) {
          const publicDir = path.resolve(process.cwd(), 'public', 'images', 'lucky-wallpapers');
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }

          const filename = `lucky_pol_${seed}_${width}x${height}.png`;
          const filePath = path.join(publicDir, filename);
          fs.writeFileSync(filePath, buffer);

          return {
            imageUrl: `/images/lucky-wallpapers/${filename}`,
            seed,
            provider: 'pollinations',
            model: 'flux',
            width,
            height,
            localPath: `/images/lucky-wallpapers/${filename}`,
          };
        }
      }
    } catch (err) {
      console.warn('Server-side image caching failed for Pollinations, falling back to direct URL:', err);
    }
  }

  return {
    imageUrl: directUrl,
    seed,
    provider: 'pollinations',
    model: 'flux',
    width,
    height,
  };
}
