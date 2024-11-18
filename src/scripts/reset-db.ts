import { prisma } from '@/lib/prisma';

async function resetDatabase() {
  try {
    console.log('🗑️ Clearing Communications table...');
    await prisma.communication.deleteMany({});
    
    console.log('🔄 Resetting user tokens...');
    await prisma.user.updateMany({
      where: { email: '3advanceinsights@gmail.com' },
      data: {
        settings: {}
      }
    });
    
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();