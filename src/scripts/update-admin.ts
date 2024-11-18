// src/scripts/update-admin.ts

/**
 * ADMIN EMAIL UPDATE PROCEDURE
 * 
 * Before running this script:
 * 1. Create new user in Clerk with new email
 * 2. Get the new user_id from Clerk Dashboard > Users
 * 3. Set OLD_ADMIN_EMAIL and NEW_ADMIN_EMAIL below
 * 4. Set OLD_USER_ID and NEW_USER_ID from Clerk
 * 
 * After running this script:
 * 1. Disconnect Gmail integration if connected
 * 2. Update any hardcoded user IDs in:
 *    - src/app/api/webhooks/twilio/sms/route.ts
 *    - src/scripts/generate-strategic-analysis.ts
 * 3. Reconnect Gmail integration with new email
 */

import { prisma } from '@/lib/prisma';

const OLD_ADMIN_EMAIL = 'haloweaveinsights@gmail.com';
const NEW_ADMIN_EMAIL = '3advanceinsights@gmail.com';
const OLD_USER_ID = 'user_2oJI9IaKIpeRiMh8bSdFMhYWuKg';
const NEW_USER_ID = 'user_2p23PtyHjdCG5akhJA2EadyRzPD';

async function updateAdminUser() {
  try {
    console.log('Starting admin user update...');

    // Update communications
    const commsUpdate = await prisma.communication.updateMany({
      where: { userId: OLD_USER_ID },
      data: { userId: NEW_USER_ID }
    });

    // Update strategic analyses
    const strategicUpdate = await prisma.strategicAnalysis.updateMany({
      where: { userId: OLD_USER_ID },
      data: { userId: NEW_USER_ID }
    });

    // Verify results
    const finalCount = await prisma.communication.count({
      where: { userId: NEW_USER_ID }
    });

    console.log('\nUpdate Summary:');
    console.log('---------------');
    console.log(`Communications updated: ${commsUpdate.count}`);
    console.log(`Strategic analyses updated: ${strategicUpdate.count}`);
    console.log(`Total communications after update: ${finalCount}`);

  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUser()
  .catch(console.error)
  .finally(() => process.exit(0));