// src/lib/env.validation.ts
import { z } from 'zod';

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  
  // Twilio
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  
  // Gmail
  GMAIL_CLIENT_ID: z.string(),
  GMAIL_CLIENT_SECRET: z.string(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  
  // URLs and Environment
  NEXT_PUBLIC_URL: z.string().url(),
  VERCEL_URL: z.string().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;