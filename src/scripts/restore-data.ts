// src/scripts/restore-data.ts
import { prisma } from '@/lib/prisma';
import { readFileSync } from 'fs';

async function restoreData() {
  try {
    // Read backup data
    const data = JSON.parse(
      readFileSync('./backup-data.json', 'utf-8')
    );

    console.log(`Found ${data.length} communications to restore`);

    // First, get all unique userIds
    const uniqueUserIds = [...new Set(data.map(comm => comm.userId))];
    console.log(`Found ${uniqueUserIds.length} unique users`);

    // Create users first
    for (const userId of uniqueUserIds) {
      try {
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: 'haloweaveinsights@gmail.com', // Default email
            role: 'ADMIN',
            settings: {}
          }
        });
        console.log(`✅ User created/verified: ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userId}:`, error);
      }
    }

    // Now restore communications
    for (const comm of data) {
      const { analysis, id, createdAt, updatedAt, ...communicationData } = comm;
      
      try {
        // Create communication with its analysis
        const restored = await prisma.communication.create({
          data: {
            id,
            ...communicationData,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
            analysis: analysis ? {
              create: {
                id: analysis.id,
                version: analysis.version,
                sentiment: analysis.sentiment,
                summary: analysis.summary,
                categories: analysis.categories,
                entities: analysis.entities,
                intentions: analysis.intentions,
                priority: analysis.priority,
                language: analysis.language,
                confidence: analysis.confidence,
                processingTime: analysis.processingTime,
                createdAt: new Date(analysis.createdAt),
                updatedAt: new Date(analysis.updatedAt)
              }
            } : undefined
          }
        });
        
        console.log(`✅ Restored communication: ${restored.id}`);
      } catch (error) {
        console.error(`❌ Failed to restore communication ${id}:`, error);
        // Log more details about the error
        if (error.code === 'P2002') {
          console.error('Duplicate record detected:', error.meta);
        }
        continue;
      }
    }
    
    console.log('🎉 Restore completed!');

    // Print final counts
    const finalComms = await prisma.communication.count();
    const finalAnalyses = await prisma.analysis.count();
    console.log(`Final counts - Communications: ${finalComms}, Analyses: ${finalAnalyses}`);

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData().catch(console.error);