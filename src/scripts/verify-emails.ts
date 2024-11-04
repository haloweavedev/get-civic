// src/scripts/verify-emails.ts
import { prisma } from '../lib/prisma';

async function verifyEmails() {
  try {
    console.log('Starting email verification...\n');

    // Get total count
    const total = await prisma.communication.count({
      where: {
        source: 'GMAIL'
      }
    });

    // Check for duplicates
    const duplicates = await prisma.$queryRaw`
      SELECT "sourceId", "userId", COUNT(*) as count
      FROM "Communication"
      WHERE source = 'GMAIL'
      GROUP BY "sourceId", "userId"
      HAVING COUNT(*) > 1
    `;

    const dupsArray = duplicates as { sourceId: string; userId: string; count: number }[];

    console.log('Email Statistics:');
    console.log('-----------------');
    console.log(`Total Gmail communications: ${total}`);
    console.log(`Number of duplicate sets: ${dupsArray.length}`);

    if (dupsArray.length > 0) {
      console.log('\nDuplicate Details:');
      for (const dup of dupsArray) {
        console.log(`SourceId: ${dup.sourceId}, Count: ${dup.count}`);
      }
    }

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmails().catch(console.error);