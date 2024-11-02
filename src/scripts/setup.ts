import { prisma } from '../lib/prisma';

async function setup() {
  try {
    // Create default user
    const user = await prisma.user.upsert({
      where: {
        email: 'haloweaveinsights@gmail.com'
      },
      update: {
        role: 'ADMIN'
      },
      create: {
        email: 'haloweaveinsights@gmail.com',
        role: 'ADMIN',
        name: 'Senate Insights Admin'
      }
    });

    console.log('Created/Updated default user:', user);

    // Create default organization
    const organization = await prisma.organization.upsert({
      where: {
        id: 'default-org'
      },
      update: {
        name: 'Senate Insights Organization',
        members: {
          upsert: {
            where: {
              organizationId_userId: {
                organizationId: 'default-org',
                userId: user.id
              }
            },
            update: {
              role: 'OWNER'
            },
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        }
      },
      create: {
        id: 'default-org',
        name: 'Senate Insights Organization',
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });

    console.log('Created/Updated default organization:', organization);

    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setup();