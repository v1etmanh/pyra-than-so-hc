import { z } from 'zod';

const boundedText = (max: number) => z.string().trim().max(max);

export const providerConfigSchema = z.object({
  type: z.enum(['openai', 'openrouter', 'anthropic', 'google', 'groq', 'grok', 'ollama', 'custom']),
  baseUrl: boundedText(2048),
  apiKeys: z.array(boundedText(512)).max(8),
  model: boundedText(200).min(1)
}).strict();

const personalityProfileSchema = z.object({
  scores: z.object({
    extraversion: z.number().finite().min(0).max(100),
    agreeableness: z.number().finite().min(0).max(100),
    conscientiousness: z.number().finite().min(0).max(100),
    emotionality: z.number().finite().min(0).max(100),
    openness: z.number().finite().min(0).max(100)
  }).strict(),
  dominantTraits: z.array(boundedText(120)).max(5).optional(),
  communicationStyle: boundedText(300).optional(),
  toneDirective: boundedText(3000).optional(),
  completedAt: z.number().finite().optional()
}).strict();

export const profileContextSchema = z.object({
  name: boundedText(200).optional(),
  birthDate: boundedText(32).optional(),
  lifePath: z.union([boundedText(20), z.number().finite()]).optional(),
  indicators: z.array(z.object({
    key: boundedText(80).min(1),
    name: boundedText(160).min(1),
    value: z.union([boundedText(500), z.number().finite()])
  }).strict()).max(24).optional()
}).strict();

export const providerModelsRequestSchema = z.object({
  baseUrl: boundedText(2048).min(1),
  apiKey: boundedText(512).optional(),
  providerType: z.enum(['openai', 'openrouter', 'anthropic', 'google', 'groq', 'grok', 'ollama', 'custom'])
}).strict();

export const lazyIndicatorRequestSchema = z.object({
  fullName: boundedText(200).optional().default(''),
  birthDay: boundedText(32).optional().default(''),
  indicatorKey: boundedText(80).min(1),
  indicatorName: boundedText(160).optional().default(''),
  indicatorValue: z.union([boundedText(500), z.number().finite()]),
  personalityProfile: personalityProfileSchema.nullable().optional(),
  providerConfig: providerConfigSchema.optional(),
  language: z.enum(['Vietnamese', 'English']).default('Vietnamese')
}).strict();

export const initialAnalysisRequestSchema = z.object({
  fullName: boundedText(200).optional().default(''),
  birthDay: boundedText(32).optional().default(''),
  coreIndicators: z.object({
    walksOfLife: z.union([boundedText(20), z.number().finite()]),
    mission: z.union([boundedText(20), z.number().finite()]),
    soul: z.union([boundedText(20), z.number().finite()]),
    personality: z.union([boundedText(20), z.number().finite()]),
    dateOfBirth: z.union([boundedText(20), z.number().finite()])
  }).strict(),
  providerConfig: providerConfigSchema.optional()
}).strict();

export const birthChartRequestSchema = z.object({
  fullName: boundedText(200).optional(),
  birthDay: boundedText(32).min(1),
  birthChartData: z.object({
    grid: z.array(z.object({
      number: z.number().int().min(0).max(9),
      frequency: z.number().int().min(0).max(10),
      isIsolated: z.boolean()
    }).strict()).max(9),
    arrows: z.array(z.object({
      name: boundedText(120),
      numbers: z.array(z.number().int().min(0).max(9)).max(9),
      type: z.enum(['strength', 'empty']),
      desc: boundedText(500)
    }).strict()).max(12)
  }).strict(),
  personalityProfile: personalityProfileSchema.optional(),
  providerConfig: providerConfigSchema.optional()
}).strict();

export const wallpaperRequestSchema = z.object({
  lifePathNumber: z.union([boundedText(20), z.number().finite()]).optional(),
  destinyNumber: z.union([boundedText(20), z.number().finite()]).optional(),
  soulUrgeNumber: z.union([boundedText(20), z.number().finite()]).optional(),
  personalityNumber: z.union([boundedText(20), z.number().finite()]).optional(),
  personalDay: z.union([boundedText(20), z.number().finite()]).optional(),
  personalYear: z.union([boundedText(20), z.number().finite()]).optional(),
  birthDate: boundedText(32).optional(),
  intentionId: boundedText(80).optional(),
  styleId: boundedText(80).optional(),
  deviceType: boundedText(40).optional(),
  fullName: boundedText(200).optional(),
  customWish: boundedText(500).optional(),
  seed: z.union([boundedText(30), z.number().finite()]).optional(),
  saveToDisk: z.boolean().optional(),
  engine: z.enum(['auto', 'pixabay', 'pexels']).optional()
}).strict();

export const surveyRequestSchema = z.object({
  locale: z.enum(['vi', 'en']),
  page: z.enum(['home', 'chat']),
  experienceRating: z.enum(['love', 'good', 'neutral', 'needsImprovement']).nullable(),
  willingness: z.enum(['yes', 'maybe', 'no']).nullable(),
  pricingModel: z.enum(['monthly', 'yearly', 'lifetime']).nullable(),
  priceRange: boundedText(100).nullable(),
  desiredFeatures: z.array(boundedText(120)).max(20).nullable(),
  customFeature: boundedText(200).nullable(),
  feedback: boundedText(1000).nullable(),
  usageCount: z.number().int().min(0).max(10_000)
}).strict();

const tarotStoredCardSchema = z.object({
  cardId: boundedText(40).min(1),
  isReversed: z.boolean(),
  positionId: boundedText(80).min(1)
}).strict();

const tarotReadingContextSchema = z.object({
  originalQuestion: boundedText(4_000).min(3),
  spreadId: boundedText(80).min(1),
  drawnCards: z.array(tarotStoredCardSchema).min(1).max(10),
  interpretation: boundedText(16_000).min(1),
  priorFollowUps: z.array(z.object({
    question: boundedText(4_000).min(1),
    interpretation: boundedText(16_000).min(1),
    additionalCards: z.array(tarotStoredCardSchema).max(3)
  }).strict()).max(10)
}).strict();

// Regeneration rebuilds the answer from the original cards and question, so it
// must also recover a session whose provider completed without returning text.
const tarotRegenerateContextSchema = tarotReadingContextSchema.extend({
  interpretation: boundedText(16_000)
});

const tarotCommonSchema = z.object({
  language: z.enum(['vi', 'en']),
  profile: profileContextSchema.optional(),
  providerConfig: providerConfigSchema.optional()
});

const tarotSpreadIdSchema = z.enum([
  'single',
  'three-card',
  'two-options',
  'relationship',
  'timeline',
  'celtic-cross'
]);

export const tarotReadingRequestSchema = z.discriminatedUnion('mode', [
  tarotCommonSchema.extend({
    mode: z.literal('initial'),
    question: boundedText(4_000).min(3),
    spreadId: tarotSpreadIdSchema
  }).strict(),
  tarotCommonSchema.extend({
    mode: z.literal('follow-up'),
    question: boundedText(4_000).min(3),
    reading: tarotReadingContextSchema
  }).strict(),
  tarotCommonSchema.extend({
    mode: z.literal('regenerate'),
    reading: tarotRegenerateContextSchema
  }).strict()
]);

export const billingCheckoutRequestSchema = z.object({
  locale: z.enum(['vi', 'en']).optional()
}).strict();

export const paypalWebhookEventSchema = z.object({
  id: boundedText(200).min(1),
  event_type: boundedText(160).min(1),
  create_time: boundedText(80).optional(),
  resource: z.record(z.string(), z.unknown()).optional()
}).passthrough();

export const payosWebhookSchema = z.object({
  code: z.union([boundedText(20), z.number().finite()]).optional(),
  desc: boundedText(500).optional(),
  success: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()),
  signature: boundedText(256).min(1)
}).passthrough();

export type ProviderModelsRequest = z.infer<typeof providerModelsRequestSchema>;
export type LazyIndicatorRequest = z.infer<typeof lazyIndicatorRequestSchema>;
export type InitialAnalysisRequest = z.infer<typeof initialAnalysisRequestSchema>;
export type BirthChartRequest = z.infer<typeof birthChartRequestSchema>;
export type WallpaperRequest = z.infer<typeof wallpaperRequestSchema>;
export type SurveyRequest = z.infer<typeof surveyRequestSchema>;
export type TarotReadingRequestPayload = z.infer<typeof tarotReadingRequestSchema>;
export type BillingCheckoutRequest = z.infer<typeof billingCheckoutRequestSchema>;
