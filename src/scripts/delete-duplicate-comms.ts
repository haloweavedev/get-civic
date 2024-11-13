// scripts/delete-duplicate-comms.ts

import { prisma } from '@/lib/prisma'; // Adjust the import path based on your project structure

async function deleteDuplicateCommunications() {
  try {
    // Step 1: Find sourceIds that have more than one communication
    const duplicates = await prisma.communication.groupBy({
      by: ['sourceId'],
      having: {
        sourceId: {
          _count: {
            gt: 1,
          },
        },
      },
      _count: {
        sourceId: true,
      },
    });

    if (duplicates.length === 0) {
      console.log('No duplicate communications found based on sourceId.');
      return;
    }

    console.log('Found duplicate communications for the following sourceIds:');
    for (const duplicate of duplicates) {
      console.log(`- sourceId: ${duplicate.sourceId}, count: ${duplicate._count.sourceId}`);
    }

    let totalDuplicatesDeleted = 0;

    // Step 2: For each duplicate sourceId, process communications
    for (const duplicate of duplicates) {
      const { sourceId } = duplicate;
      const communications = await prisma.communication.findMany({
        where: { sourceId },
        orderBy: { createdAt: 'asc' }, // Assuming there's a createdAt field
      });

      // Keep the first communication (oldest), delete the rest
      const [keep, ...toDelete] = communications;

      for (const comm of toDelete) {
        // Delete related Analysis records first
        await prisma.analysis.deleteMany({
          where: { communicationId: comm.id },
        });

        // Then delete the Communication record
        await prisma.communication.delete({
          where: { id: comm.id },
        });

        totalDuplicatesDeleted += 1;
      }
    }

    console.log(`Successfully deleted ${totalDuplicatesDeleted} duplicate communications and related analysis records.`);
  } catch (error) {
    console.error('Error deleting duplicate communications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicateCommunications();