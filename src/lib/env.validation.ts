import { z } from 'zod';

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  
  // Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string(),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('SK'),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string().startsWith('+'),
  
  // Gmail
  GMAIL_CLIENT_ID: z.string().includes('.apps.googleusercontent.com'),
  GMAIL_CLIENT_SECRET: z.string().startsWith('GOCSPX-'),
  
  // URLs
  NEXT_PUBLIC_URL: z.string().url(),
  VERCEL_URL: z.string().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;