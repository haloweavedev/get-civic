// src/scripts/setup.ts
import { prisma } from '@/lib/prisma';

async function setup() {
  try {
    // Create default admin user
    const user = await prisma.user.upsert({
      where: {
        email: '3advanceinsights@gmail.com'
      },
      update: {
        role: 'ADMIN'
      },
      create: {
        email: '3advanceinsights@gmail.com',
        role: 'ADMIN',
        name: 'Get Civic Admin',
        settings: {}
      }
    });

    console.log('Created/Updated admin user:', user);

  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setup();