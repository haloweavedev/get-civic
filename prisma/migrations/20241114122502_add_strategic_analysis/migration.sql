-- CreateTable
CREATE TABLE "StrategicAnalysis" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "criticalIssues" JSONB NOT NULL,
    "recommendedActions" JSONB NOT NULL,
    "monitoringPriorities" JSONB NOT NULL,
    "newCommunicationsCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrategicAnalysis_userId_idx" ON "StrategicAnalysis"("userId");

-- CreateIndex
CREATE INDEX "StrategicAnalysis_timestamp_idx" ON "StrategicAnalysis"("timestamp");
