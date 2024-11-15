// src/scripts/migrate-communications.ts

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

async function migrateCommunicationsData() {
  try {
    console.log('🚀 Starting communications data migration...\n');

    // 1. First get statistics before migration
    const beforeStats = await prisma.communication.groupBy({
      by: ['type'],
      _count: true
    });

    console.log('📊 Current Statistics:');
    console.table(beforeStats.map(stat => ({
      type: stat.type,
      count: stat._count
    })));

    // 2. Identify and mark automated responses
    const automatedResponses = await prisma.communication.findMany({
      where: {
        OR: [
          { sourceId: { startsWith: 'ai-response-' } },
          { subject: { equals: 'AI Response' } }
        ]
      }
    });

    console.log(`\n🤖 Found ${automatedResponses.length} automated responses`);

    // 3. Update automated responses
    for (const response of automatedResponses) {
      const originalId = response.sourceId.replace('ai-response-', '');
      
      await prisma.communication.update({
        where: { id: response.id },
        data: {
          source: 'AUTOMATED',
          isAutomatedResponse: true,
          excludeFromAnalysis: true,
          parentCommunicationId: originalId
        }
      });
    }

    // 4. Mark all other communications as HUMAN
    await prisma.communication.updateMany({
      where: {
        NOT: {
          id: { in: automatedResponses.map(r => r.id) }
        }
      },
      data: {
        source: 'HUMAN',
        isAutomatedResponse: false,
        excludeFromAnalysis: false
      }
    });

    // 5. Get statistics after migration
    const afterStats = await prisma.communication.groupBy({
      by: ['source'],
      _count: true
    });

    console.log('\n📊 Post-Migration Statistics:');
    console.table(afterStats.map(stat => ({
      source: stat.source,
      count: stat._count
    })));

    // 6. Verify parent-child relationships
    const verifyRelationships = await prisma.communication.findMany({
      where: {
        isAutomatedResponse: true
      },
      select: {
        id: true,
        parentCommunicationId: true
      }
    });

    const validRelationships = verifyRelationships.filter(r => r.parentCommunicationId);
    console.log(
      '\n🔗 Relationship Verification:',
      `\n- Total automated responses: ${verifyRelationships.length}`,
      `\n- Valid parent relationships: ${validRelationships.length}`
    );

    // 7. Clean up any orphaned analyses
    const deletedAnalyses = await prisma.analysis.deleteMany({
      where: {
        communication: {
          excludeFromAnalysis: true
        }
      }
    });

    console.log(
      '\n🧹 Cleanup:',
      `\n- Deleted ${deletedAnalyses.count} analyses from excluded communications`
    );

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateCommunicationsData()
    .catch(console.error)
    .finally(() => process.exit());
}