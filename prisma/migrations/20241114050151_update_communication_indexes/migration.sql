/*
  Warnings:

  - A unique constraint covering the columns `[sourceId,userId,type]` on the table `Communication` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Communication_createdAt_idx";

-- DropIndex
DROP INDEX "Communication_sourceId_userId_key";

-- CreateIndex
CREATE INDEX "Communication_createdAt_status_idx" ON "Communication"("createdAt", "status");

-- CreateIndex
CREATE INDEX "Communication_type_status_idx" ON "Communication"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Communication_sourceId_userId_type_key" ON "Communication"("sourceId", "userId", "type");
