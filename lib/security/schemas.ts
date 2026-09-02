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

const chatProfileSchema = z.object({
  name: boundedText(200).optional(),
  birthDate: boundedText(32).optional(),
  lifePath: z.union([boundedText(20), z.number().finite()]).optional(),
  indicators: z.array(z.object({
    key: boundedText(80).min(1),
    name: boundedText(160).min(1),
    value: z.union([boundedText(80), z.number().finite()])
  }).strict()).max(24).optional()
}).strict();

export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: boundedText(16_000).min(1)
  }).strict()).min(1).max(30),
  providerConfig: providerConfigSchema.optional(),
  skipExpansion: z.boolean().optional(),
  language: boundedText(40).optional(),
  systemPrompt: boundedText(16_000).optional(),
  profile: chatProfileSchema.optional()
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
  indicatorValue: z.union([boundedText(80), z.number().finite()]),
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

export const qaRequestSchema = z.object({
  question: boundedText(12_000).min(3),
  indicatorKey: boundedText(80).optional(),
  indicatorValue: z.union([boundedText(80), z.number().finite()]).optional(),
  locale: z.enum(['vi', 'en']).optional(),
  profile: chatProfileSchema.optional(),
  mode: z.enum(['inspect', 'mock', 'stream']).optional(),
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
  engine: z.enum(['auto', 'cloudflare', 'pollinations']).optional()
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

export const checkoutRequestSchema = z.object({
  plan: z.literal('pro'),
  locale: z.enum(['vi', 'en']).optional()
}).strict();

export const stripeWebhookEventSchema = z.object({
  id: boundedText(200).optional(),
  type: boundedText(120).min(1),
  data: z.object({
    object: z.record(z.string(), z.unknown()).optional()
  }).optional()
}).passthrough();

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ProviderModelsRequest = z.infer<typeof providerModelsRequestSchema>;
export type LazyIndicatorRequest = z.infer<typeof lazyIndicatorRequestSchema>;
export type InitialAnalysisRequest = z.infer<typeof initialAnalysisRequestSchema>;
export type BirthChartRequest = z.infer<typeof birthChartRequestSchema>;
export type QARequest = z.infer<typeof qaRequestSchema>;
export type WallpaperRequest = z.infer<typeof wallpaperRequestSchema>;
export type SurveyRequest = z.infer<typeof surveyRequestSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
