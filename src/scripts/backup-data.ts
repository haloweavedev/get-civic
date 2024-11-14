// src/scripts/backup-data.ts
import { prisma } from '@/lib/prisma';
import { writeFileSync } from 'fs';

async function backupData() {
  const communications = await prisma.communication.findMany({
    include: { analysis: true }
  });
  
  writeFileSync(
    './backup-data.json', 
    JSON.stringify(communications, null, 2)
  );
}

backupData();