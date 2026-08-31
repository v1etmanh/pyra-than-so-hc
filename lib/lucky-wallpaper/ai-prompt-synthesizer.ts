// -*- coding: utf-8 -*-
import {
  getOrderedModelCandidates,
  getProviderCascade,
  isCredentialProviderError,
  markModelFailure,
  markProviderFailure,
  requestChatCompletion
} from '@/app/api/chat/lib/provider-cascade';
import {
  NUMEROLOGY_AESTHETICS_MAP,
  WALLPAPER_STYLES,
  INTENTION_OPTIONS,
  DEVICE_ASPECT_RATIOS,
  NumberAesthetics,
  StylePreset,
  IntentionOption,
  DeviceAspectRatio,
} from './constants';
import { buildLuckyWallpaperPrompt } from './prompt-builder';

export interface AIPromptSynthesizerInput {
  fullName?: string;
  birthDate?: string;
  lifePathNumber: number;
  destinyNumber?: number | string;
  soulUrgeNumber?: number | string;
  personalityNumber?: number | string;
  personalDay?: number;
  personalYear?: number;
  styleId?: string;
  intentionId?: string;
  deviceType?: string;
  customWish?: string;
}

export interface AISynthesizedWallpaperPlan {
  visualPrompt: string;
  negativePrompt: string;
  explanation_vi: string;
  explanation_en: string;
  affirmation_vi: string;
  affirmation_en: string;
  luckyColors_vi: string[];
  luckyColors_en: string[];
  sacredSymbols: string[];
  lifePathNumber: number;
  personalDay: number;
  style: StylePreset;
  intention: IntentionOption;
  device: DeviceAspectRatio;
  width: number;
  height: number;
  isAIGenerated: boolean;
  aiProvider: string;
  aiModel: string;
}

const SYSTEM_PROMPT_ART_DIRECTOR = `You are a World-Class Sacred Geometry Art Director, Master Astrologer, and High-End Luxury Wallpaper Designer.
Your mission is to craft a breath-taking, cinematic, ultra-detailed image generation prompt for FLUX / Midjourney / Stable Diffusion based on a person's Sacred Numerology Blueprint.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "visualPrompt": "string (A complete, masterfully crafted English prompt for FLUX/SD with vivid visual descriptions of sacred geometry, cosmic lighting, 3D volumetric textures, luxurious material rendering, balanced composition, no text/watermark)",
  "negativePrompt": "string (Negative prompt filtering artifacts, blur, lowres, text, watermark, bad anatomy)",
  "explanation_vi": "string (2-3 câu tiếng Việt giải thích sâu sắc về việc sự kết hợp giữa các con số, biểu tượng thiêng và màu sắc trong bức tranh kích hoạt vận may, bình an và năng lượng tích cực cho gia chủ)",
  "explanation_en": "string (2-3 sentences in English explaining the numerological alignment and energy of the artwork)",
  "affirmation_vi": "string (1 câu khẳng định tích cực / thần chú kích hoạt năng lượng phong thủy bằng tiếng Việt)",
  "affirmation_en": "string (1 positive affirmation in English)",
  "luckyColors_vi": ["string", "string", "string"],
  "luckyColors_en": ["string", "string", "string"],
  "sacredSymbols": ["string", "string"]
}

Guidelines for visualPrompt:
1. Emphasize SACRED GEOMETRY (e.g., Metatron's Cube, Golden Ratio Spiral, Torus Energy Field, Sri Yantra, Flower of Life, Platonic Solids, Merkaba, Celestial Constellations).
2. Specify LUXURIOUS MATERIALS & TEXTURES (e.g., 24k polished gold, ethereal frosted glass, bioluminescent obsidian, radiant crystal quartz, silk ribbons of starlight, floating stardust).
3. Specify CINEMATIC LIGHTING (e.g., volumetric god rays, prismatic sub-surface scattering, ethereal rim lighting, dramatic chiaroscuro, cosmic aura).
4. Strictly enforce: "clean centered composition, 8k resolution, photorealistic cinematic render, octane render, pristine aesthetic, no text, no words, no letters, no watermark, no logos, no distorted human faces".
5. Tailor the artwork to the chosen Style, Intention, and Numerological Numbers.`;

function repairJsonDocument(text: string): string {
  let repaired = '';
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (const char of text) {
    if (inString) {
      if (escaped) {
        repaired += char;
        escaped = false;
      } else if (char === '\\') {
        repaired += char;
        escaped = true;
      } else if (char === '"') {
        repaired += char;
        inString = false;
      } else if (char === '\n' || char === '\r') {
        repaired += '\\n';
      } else {
        repaired += char;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      repaired += char;
    } else {
      repaired += char;
      if (char === '{' || char === '[') stack.push(char);
      if (char === '}' && stack.at(-1) === '{') stack.pop();
      if (char === ']' && stack.at(-1) === '[') stack.pop();
    }
  }

  if (inString) repaired += '"';
  while (stack.length > 0) repaired += stack.pop() === '{' ? '}' : ']';
  return repaired;
}

function extractJsonFromResponse(text: string): any | null {
  let content = text.trim();

  // 1. Try matching code block with any language tag: ```...```
  const codeBlockMatch = content.match(/```[\w-]*\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    content = codeBlockMatch[1].trim();
  } else {
    // If no closing backticks, strip leading/trailing ```
    content = content.replace(/^```[\w-]*\s*/, '').replace(/\s*```$/, '').trim();
  }

  // 2. Find the outermost { and }
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1).trim();
  }

  // 3. Parse normal JSON first, then tolerate common LLM formatting/truncation errors.
  const sanitized = content
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  for (const candidate of [content, sanitized, repairJsonDocument(sanitized)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next repair strategy/provider.
    }
  }

  return null;
}

export async function synthesizeSacredWallpaperPrompt(
  input: AIPromptSynthesizerInput
): Promise<AISynthesizedWallpaperPlan> {
  const lpNum = Number(input.lifePathNumber) || 1;
  const dayNum = Number(input.personalDay) || 1;
  const yearNum = Number(input.personalYear) || new Date().getFullYear();

  const lpAesthetics: NumberAesthetics =
    NUMEROLOGY_AESTHETICS_MAP[lpNum] || NUMEROLOGY_AESTHETICS_MAP[1];
  const dayAesthetics: NumberAesthetics =
    NUMEROLOGY_AESTHETICS_MAP[dayNum] || NUMEROLOGY_AESTHETICS_MAP[1];

  const style =
    WALLPAPER_STYLES.find((s) => s.id === input.styleId) || WALLPAPER_STYLES[0];
  const intention =
    INTENTION_OPTIONS.find((i) => i.id === input.intentionId) || INTENTION_OPTIONS[0];
  const device =
    DEVICE_ASPECT_RATIOS.find((d) => d.id === input.deviceType) || DEVICE_ASPECT_RATIOS[0];

  // Try LLM Art Director first
  const providers = getProviderCascade();

  if (providers.length > 0) {
    const userContextPrompt = `USER NUMEROLOGY BLUEPRINT:
- Name: ${input.fullName || 'Numina Explorer'}
- Birth Date: ${input.birthDate || 'N/A'}
- Life Path Number: ${lpNum} (${lpAesthetics.name_en} / ${lpAesthetics.name_vi})
- Personal Day: ${dayNum} (${dayAesthetics.name_en} / ${dayAesthetics.name_vi})
- Personal Year: ${yearNum}
- Destiny Number: ${input.destinyNumber || 'N/A'}
- Soul Urge Number: ${input.soulUrgeNumber || 'N/A'}
- Chosen Visual Style: ${style.name_en} (${style.description_vi})
- Sacred Intention: ${intention.name_en} (${intention.name_vi} - ${intention.affirmation_vi})
- Device Aspect Ratio: ${device.label_en} (${device.ratio}, ${device.width}x${device.height})
- Custom Personal Wish/Focus: ${input.customWish?.trim() || 'Attract harmony, abundance, and clarity'}
- Recommended Symbolic Motifs: ${lpAesthetics.sacredSymbol_en}, ${dayAesthetics.keywords_en.join(', ')}

Please generate the complete JSON specification now:`;

    const candidates = getOrderedModelCandidates(providers);
    const failedProvidersInRequest = new Set<typeof providers[number]>();
    for (const candidate of candidates) {
      const { provider, model, apiKey } = candidate;
      if (failedProvidersInRequest.has(provider)) continue;
        try {
          const resp = await requestChatCompletion(
            provider,
            model,
            [
              { role: 'system', content: SYSTEM_PROMPT_ART_DIRECTOR },
              { role: 'user', content: userContextPrompt },
            ],
            apiKey,
            { temperature: 0.7, maxTokens: 1200, timeoutMs: 15000 }
          );

          if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            console.warn(`[AIPromptSynthesizer] Provider ${provider.name} model ${model} HTTP ${resp.status}:`, errText.slice(0, 200));
            if (isCredentialProviderError(resp.status)) {
              markModelFailure(candidate);
            } else {
              markProviderFailure(candidate);
              failedProvidersInRequest.add(provider);
            }
            continue;
          }

          const resData = await resp.json();
          const rawContent = resData?.choices?.[0]?.message?.content;
          if (!rawContent) {
            markProviderFailure(candidate);
            failedProvidersInRequest.add(provider);
            continue;
          }

          const parsed = extractJsonFromResponse(rawContent);

          if (parsed && parsed.visualPrompt && typeof parsed.visualPrompt === 'string') {
            console.log(`[AIPromptSynthesizer] Prompt successfully generated by ${provider.name} (${model})!`);
            return {
              visualPrompt: parsed.visualPrompt.trim(),
              negativePrompt:
                parsed.negativePrompt ||
                'blurry, low quality, distorted, deformed, text, watermark, signature, ugly, grain, lowres, oversaturated, pixelated, bad proportions, bad anatomy, cropped',
              explanation_vi: parsed.explanation_vi || `${intention.name_vi}: ${intention.affirmation_vi}`,
              explanation_en: parsed.explanation_en || `${intention.name_en}: ${intention.affirmation_en}`,
              affirmation_vi: parsed.affirmation_vi || intention.affirmation_vi,
              affirmation_en: parsed.affirmation_en || intention.affirmation_en,
              luckyColors_vi: Array.isArray(parsed.luckyColors_vi)
                ? parsed.luckyColors_vi
                : lpAesthetics.primaryColors_vi,
              luckyColors_en: Array.isArray(parsed.luckyColors_en)
                ? parsed.luckyColors_en
                : lpAesthetics.primaryColors_en,
              sacredSymbols: Array.isArray(parsed.sacredSymbols)
                ? parsed.sacredSymbols
                : [lpAesthetics.sacredSymbol_en, lpAesthetics.sacredSymbol_vi],
              lifePathNumber: lpNum,
              personalDay: dayNum,
              style,
              intention,
              device,
              width: device.width,
              height: device.height,
              isAIGenerated: true,
              aiProvider: provider.name,
              aiModel: model,
            };
          }

          // A successful HTTP response with invalid JSON is still a failed
          // model attempt for this structured-output task.
          markProviderFailure(candidate);
          failedProvidersInRequest.add(provider);
        } catch (err) {
          console.warn(`[AIPromptSynthesizer] Model ${model} on ${provider.name} failed:`, err);
          markProviderFailure(candidate);
          failedProvidersInRequest.add(provider);
          continue;
        }
    }
  }

  // Fallback to Algorithmic Builder if LLM cascade is unavailable
  console.log('[AIPromptSynthesizer] Falling back to algorithmic prompt builder.');
  const fallbackPlan = buildLuckyWallpaperPrompt(input);

  return {
    visualPrompt: fallbackPlan.prompt,
    negativePrompt: fallbackPlan.negativePrompt,
    explanation_vi: fallbackPlan.explanation_vi,
    explanation_en: fallbackPlan.explanation_en,
    affirmation_vi: fallbackPlan.affirmation_vi,
    affirmation_en: fallbackPlan.affirmation_en,
    luckyColors_vi: fallbackPlan.luckyColors_vi,
    luckyColors_en: fallbackPlan.luckyColors_en,
    sacredSymbols: [lpAesthetics.sacredSymbol_en, lpAesthetics.sacredSymbol_vi],
    lifePathNumber: lpNum,
    personalDay: dayNum,
    style,
    intention,
    device,
    width: device.width,
    height: device.height,
    isAIGenerated: false,
    aiProvider: 'Algorithmic fallback',
    aiModel: 'built-in prompt builder',
  };
}
