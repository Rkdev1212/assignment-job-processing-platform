-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "delay" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMPTZ(3),
    "workerId" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "executionTime" INTEGER,
    "lastError" TEXT,
    "correlationId" VARCHAR(255) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_timeline" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "previousStatus" VARCHAR(50),
    "newStatus" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "job_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_type_idx" ON "jobs"("type");

-- CreateIndex
CREATE INDEX "jobs_correlationId_idx" ON "jobs"("correlationId");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");

-- CreateIndex
CREATE INDEX "jobs_priority_idx" ON "jobs"("priority");

-- CreateIndex
CREATE INDEX "jobs_runAt_idx" ON "jobs"("runAt");

-- CreateIndex
CREATE INDEX "job_timeline_jobId_idx" ON "job_timeline"("jobId");

-- CreateIndex
CREATE INDEX "job_timeline_timestamp_idx" ON "job_timeline"("timestamp");

-- AddForeignKey
ALTER TABLE "job_timeline" ADD CONSTRAINT "job_timeline_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
