import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  log: ['query', 'warn', 'error'],
});

async function inspectDatabase() {
  try {
    console.log('Starting database inspection...');
    const output: any = {
      timestamp: new Date().toISOString(),
      summary: {},
      data: {},
    };

    // Get counts
    const [
      communicationsCount,
      analysisCount,
      usersCount,
      organizationsCount
    ] = await Promise.all([
      prisma.communication.count(),
      prisma.analysis.count(),
      prisma.user.count(),
      prisma.organization.count(),
    ]);

    // Capture counts
    output.summary = {
      communications: communicationsCount,
      analysis: analysisCount,
      users: usersCount,
      organizations: organizationsCount,
    };

    // Get all communications with full details
    const communications = await prisma.communication.findMany({
      include: {
        analysis: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get statistics about data
    const typeDistribution = await prisma.communication.groupBy({
      by: ['type'],
      _count: true,
    });

    const statusDistribution = await prisma.communication.groupBy({
      by: ['status'],
      _count: true,
    });

    const timeBasedStats = await prisma.communication.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Add detailed data
    output.data = {
      communications,
      statistics: {
        typeDistribution,
        statusDistribution,
        timeBasedStats,
      },
    };

    // Write full output to file
    const outputPath = path.join(process.cwd(), 'database-inspection.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(output, null, 2)
    );

    // Print summary to console
    console.log('\nDatabase Summary:');
    console.log('----------------');
    console.log(`Total Communications: ${communicationsCount}`);
    console.log(`Total Analysis Records: ${analysisCount}`);
    console.log(`Total Users: ${usersCount}`);
    console.log(`Total Organizations: ${organizationsCount}`);
    
    if (communications.length > 0) {
      console.log('\nSample Communication:');
      const sample = communications[0];
      console.log('\nMetadata Structure:', Object.keys(sample.metadata));
      console.log('Content Preview:', sample.content?.substring(0, 100) + '...');
    }

    console.log('\nType Distribution:');
    console.log(typeDistribution);
    
    console.log('\nStatus Distribution:');
    console.log(statusDistribution);

    console.log('\nInspection complete! Check database-inspection.json for full details.');

  } catch (error) {
    console.error('Inspection failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase()
  .catch(console.error)
  .finally(() => process.exit(0));