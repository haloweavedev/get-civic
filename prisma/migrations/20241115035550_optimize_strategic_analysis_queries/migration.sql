-- CreateIndex
CREATE INDEX "Communication_userId_createdAt_status_idx" ON "Communication"("userId", "createdAt", "status");

-- CreateIndex
CREATE INDEX "Communication_userId_type_idx" ON "Communication"("userId", "type");

-- AddForeignKey
ALTER TABLE "StrategicAnalysis" ADD CONSTRAINT "StrategicAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
