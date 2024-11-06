import { prisma } from '@/lib/prisma';

async function resetAnalysis() {
  try {
    // Delete all analysis records
    await prisma.analysis.deleteMany({});
    
    // Reset all communications to PENDING
    await prisma.communication.updateMany({
      data: {
        status: 'PENDING'
      }
    });

    console.log('Successfully reset all analysis');
  } catch (error) {
    console.error('Reset failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAnalysis().catch(console.error);