// src/scripts/check-comms.ts

import { prisma } from '@/lib/prisma';

async function checkCommunications() {
  try {
    // Get all communications with their status
    const communications = await prisma.communication.findMany({
      select: {
        id: true,
        type: true,
        status: true,
        subject: true,
        userId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\nCommunications Overview:');
    console.log('----------------------');
    console.log('Total Count:', communications.length);

    // Group by status
    const statusGroups = communications.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nStatus Distribution:');
    console.log(statusGroups);

    // Show few recent records
    console.log('\nRecent Communications:');
    communications.slice(0, 3).forEach(comm => {
      console.log({
        id: comm.id,
        subject: comm.subject,
        status: comm.status,
        userId: comm.userId,
        createdAt: comm.createdAt
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCommunications();