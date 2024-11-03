// src/scripts/debug-user.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUser() {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: 'user_2oJLzE9oWUZmN7nAxV2MHJ2W5qJ'
      },
      select: {
        id: true,
        email: true,
        settings: true
      }
    });

    console.log('User Debug Data:', JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Debug Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser();