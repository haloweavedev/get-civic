// scripts/delete-comms.ts

import { prisma } from '@/lib/prisma'; // Adjust the import path based on your project structure

async function deleteCommunications() {
    const communicationIds = [
      'cm35jqdpb0003nsyxg668jnp1',
      'cm33vf16w00014ighpj6y9gf5',
      'cm33w32kv00017uw7nvgzmqwz',
      'cm36ttxxe0007wrvcrn4stby5',
      'cm36niptq000113lflj9g8gmi',
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