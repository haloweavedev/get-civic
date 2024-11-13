// scripts/delete-comms.ts

import { prisma } from '@/lib/prisma'; // Adjust the import path based on your project structure

async function deleteCommunications() {
    const communicationIds = [
      'cm337z1sc0003vy6j6xvna228',
      'cm338zcy40001l4ys1rd4i2s2',
    ];
  
    try {
      for (const id of communicationIds) {
        // Delete related Analysis records first
        await prisma.analysis.deleteMany({
          where: { communicationId: id },
        });
  
        // Then delete the Communication record
        await prisma.communication.delete({
          where: { id },
        });
      }
  
      console.log('Successfully deleted communications and related analysis records.');
    } catch (error) {
      console.error('Error deleting communications:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  deleteCommunications();