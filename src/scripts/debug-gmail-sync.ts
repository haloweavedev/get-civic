// src/scripts/debug-gmail-sync.ts
import diagnoseGmailSync from '../lib/integrations/gmail/diagnostic';

async function main() {
  try {
    await diagnoseGmailSync();
  } catch (error) {
    console.error('Debug script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}