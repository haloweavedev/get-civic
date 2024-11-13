// src/scripts/reanalyze.ts
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: join(__dirname, '../../.env') });

import { AIAnalysisService } from '../lib/services/ai-analysis';

async function main() {
  try {
    console.log('Environment loaded:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasDB: !!process.env.DATABASE_URL,
    });
    
    console.log('Starting reanalysis...');
    await AIAnalysisService.reanalyzeAll();
  } catch (error) {
    console.error('Reanalysis failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);