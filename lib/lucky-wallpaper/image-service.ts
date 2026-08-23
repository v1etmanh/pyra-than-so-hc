// -*- coding: utf-8 -*-
import * as fs from 'fs';
import * as path from 'path';

export interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  engine?: 'auto' | 'subnp' | 'pollinations';
  model?: 'magic' | 'flux';
  saveToDisk?: boolean;
}

function getConfiguredImageModel(): 'magic' | 'flux' {
  const configured = process.env.WALLPAPER_IMAGE_MODEL?.trim().toLowerCase();
  return configured === 'magic' ? 'magic' : 'flux';
}

export interface ImageGenerationResult {
  imageUrl: string;
  seed: number;
  provider: 'subnp' | 'pollinations' | 'local';
  model: string;
  width: number;
  height: number;
  localPath?: string;
}

/**
 * Generate image using Subnp.com SSE API (Model: Magic / Flux)
 */
export async function generateViaSubnp(
  prompt: string,
  model: 'magic' | 'flux' = 'magic',
  timeoutMs: number = 25000
): Promise<{ imageUrl: string; model: string } | null> {
  const modelsToTry = [model];
  if (model !== 'magic') modelsToTry.push('magic');
  if (!modelsToTry.includes('flux')) modelsToTry.push('flux');

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };

  for (const targetModel of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch('https://subnp.com/api/free/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, model: targetModel }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok || !resp.body) {
        continue;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let imageUrl: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.substring(6).trim();
            try {
              const data = JSON.parse(jsonStr);
              if (data.status === 'complete' && data.imageUrl) {
                imageUrl = data.imageUrl;
                break;
              } else if (data.status === 'error') {
                break;
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }

        if (imageUrl) break;
      }

      if (imageUrl) {
        return { imageUrl, model: targetModel };
      }
    } catch (err) {
      console.warn(`Subnp model ${targetModel} attempt failed:`, err);
      continue;
    }
  }

  return null;
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
 * Main Wallpaper Generation Function with Subnp Magic + Pollinations Fallback
 */
export async function generateWallpaperImage(
  options: GenerateImageOptions
): Promise<ImageGenerationResult> {
  const width = options.width || 720;
  const height = options.height || 1280;
  const seed = options.seed || Math.floor(Math.random() * 10000000);
  const prompt = options.prompt;
  const engine = options.engine || 'auto';

  // 1. Try Subnp Magic if engine is 'auto' or 'subnp'
  if (engine === 'auto' || engine === 'subnp') {
    try {
      const subnpRes = await generateViaSubnp(
        prompt,
        options.model || getConfiguredImageModel(),
        20000
      );
      if (subnpRes && subnpRes.imageUrl) {
        return {
          imageUrl: subnpRes.imageUrl,
          seed,
          provider: 'subnp',
          model: subnpRes.model,
          width,
          height,
        };
      }
    } catch (err) {
      console.warn('Subnp generator failed, falling back to Pollinations:', err);
    }
  }

  // 2. Fallback to Pollinations FLUX
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

          const filename = `lucky_${seed}_${width}x${height}.png`;
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
      console.warn('Server-side image caching failed, falling back to direct URL:', err);
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
