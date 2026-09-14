import { z } from 'zod';
import { providerConfigSchema } from '../security/schemas.ts';

const boundedText = (max: number) => z.string().trim().max(max);

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return false;

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

function isValidCivilTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const birthDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid birth date format (YYYY-MM-DD)')
  .refine(isValidCalendarDate, 'Birth date is not a valid calendar date');

const birthTimeSchema = z.union([
  z.literal(''),
  z.string()
    .regex(/^\d{2}:\d{2}$/, 'Invalid birth time format (HH:MM)')
    .refine(isValidCivilTime, 'Birth time must be between 00:00 and 23:59')
]);

const timeZoneSchema = boundedText(100)
  .min(1, 'Timezone is required')
  .refine(isValidTimeZone, 'Timezone must be a valid IANA timezone');

export const baziPersonInputSchema = z.object({
  name: boundedText(100).min(1, 'Name is required'),
  birthDate: birthDateSchema,
  birthTime: birthTimeSchema.optional(),
  timezone: timeZoneSchema.default('Asia/Ho_Chi_Minh'),
  calculationSex: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Calculation sex must be male or female' })
  })
}).strict();

export const baziChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: boundedText(8_000)
}).strict();

export const baziLoveReadingRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('initial'),
    people: z.tuple([baziPersonInputSchema, baziPersonInputSchema]),
    language: z.enum(['vi', 'en']).default('vi'),
    question: boundedText(2_000).optional(),
    providerConfig: providerConfigSchema.optional()
  }).strict(),
  z.object({
    mode: z.literal('follow-up'),
    people: z.tuple([baziPersonInputSchema, baziPersonInputSchema]),
    language: z.enum(['vi', 'en']).default('vi'),
    question: boundedText(2_000).min(1, 'Question is required for follow-up'),
    history: z.array(baziChatMessageSchema).max(20).default([]),
    providerConfig: providerConfigSchema.optional()
  }).strict(),
  z.object({
    mode: z.literal('regenerate'),
    people: z.tuple([baziPersonInputSchema, baziPersonInputSchema]),
    language: z.enum(['vi', 'en']).default('vi'),
    question: boundedText(2_000).optional(),
    providerConfig: providerConfigSchema.optional()
  }).strict()
]);

export type BaziLoveReadingRequestPayload = z.infer<typeof baziLoveReadingRequestSchema>;
