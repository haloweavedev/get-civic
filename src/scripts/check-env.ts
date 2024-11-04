import { envSchema } from '../lib/env.validation';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔍 Checking environment variables...');

try {
  const env = envSchema.parse(process.env);
  console.log('✅ Environment variables are valid!');
  
  // Log which URL will be used
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  
  console.log('\nℹ️ Base URL:', baseUrl);
  
  // Log configuration status
  console.log('\n📦 Configuration Status:');
  console.log('- Database:', env.DATABASE_URL ? '✅' : '❌');
  console.log('- Clerk Auth:', env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅' : '❌');
  console.log('- OpenAI:', env.OPENAI_API_KEY ? '✅' : '❌');
  console.log('- Twilio:', env.TWILIO_ACCOUNT_SID ? '✅' : '❌');
  console.log('- Gmail:', env.GMAIL_CLIENT_ID ? '✅' : '❌');
} catch (error) {
  console.error('\n❌ Environment validation failed:');
  console.error(error);
  process.exit(1);
}