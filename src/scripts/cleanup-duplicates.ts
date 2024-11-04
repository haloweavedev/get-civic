// src/scripts/cleanup-duplicates.ts
import { prisma } from '../lib/prisma';

async function cleanup() {
  try {
    console.log('Starting cleanup...');

    // Get all duplicate combinations
    const duplicates = await prisma.$queryRaw`
      SELECT "sourceId", "userId", "source", COUNT(*) as count
      FROM "Communication"
      GROUP BY "sourceId", "userId", "source"
      HAVING COUNT(*) > 1
    `;

    const dupsArray = duplicates as { sourceId: string; userId: string; source: string; count: number }[];
    console.log(`Found ${dupsArray.length} sets of duplicates`);

    for (const dup of dupsArray) {
      // Get all records for this combination
      const records = await prisma.communication.findMany({
        where: {
          sourceId: dup.sourceId,
          userId: dup.userId,
          source: dup.source
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (records.length > 1) {
        const [keep, ...duplicatesToRemove] = records;

        // Delete duplicates
        const deleteResult = await prisma.communication.deleteMany({
          where: {
            id: {
              in: duplicatesToRemove.map(r => r.id)
            }
          }
        });

        console.log(
          `Processed sourceId: ${dup.sourceId}, ` +
          `kept: ${keep.id}, ` +
          `removed: ${deleteResult.count} duplicates`
        );
      }
    }

    // Final verification
    const finalCount = await prisma.communication.count({
      where: {
        source: 'GMAIL'
      }
    });

    console.log('\nCleanup Summary:');
    console.log('----------------');
    console.log(`Total Gmail communications after cleanup: ${finalCount}`);
    console.log('Cleanup completed successfully');

  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup().catch(console.error);