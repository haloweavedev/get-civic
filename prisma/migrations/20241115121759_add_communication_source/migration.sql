-- CreateEnum
CREATE TYPE "CommunicationSource" AS ENUM ('HUMAN', 'AUTOMATED', 'SYSTEM');

-- AlterTable
ALTER TABLE "Communication" ADD COLUMN     "excludeFromAnalysis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAutomatedResponse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentCommunicationId" TEXT,
ADD COLUMN     "source" "CommunicationSource" NOT NULL DEFAULT 'HUMAN';

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_parentCommunicationId_fkey" FOREIGN KEY ("parentCommunicationId") REFERENCES "Communication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
