// src/lib/env.ts
import { envSchema } from './env.validation';

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}

const env = validateEnv();

export const getBaseUrl = () => {
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return env.NEXT_PUBLIC_URL;
};

export default {
  baseUrl: getBaseUrl(),
  isProd: process.env.NODE_ENV === 'production',
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER
  },
  gmail: {
    clientId: env.GMAIL_CLIENT_ID,
    clientSecret: env.GMAIL_CLIENT_SECRET
  },
  openai: {
    apiKey: env.OPENAI_API_KEY
  },
  database: {
    url: env.DATABASE_URL,
    directUrl: env.DIRECT_URL
  }
};