-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TELEGRAM', 'FLASH_CALL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "StepDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cascades" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cascades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cascade_steps" (
    "id" TEXT NOT NULL,
    "cascadeId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 60,
    "providerName" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cascade_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_sessions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "cascadeId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hashedCode" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_attempts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "StepDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "costUsd" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_apiKey_key" ON "projects"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "cascade_steps_cascadeId_stepOrder_key" ON "cascade_steps"("cascadeId", "stepOrder");

-- CreateIndex
CREATE INDEX "verification_sessions_phone_status_idx" ON "verification_sessions"("phone", "status");

-- CreateIndex
CREATE INDEX "delivery_attempts_sessionId_idx" ON "delivery_attempts"("sessionId");

-- AddForeignKey
ALTER TABLE "cascades" ADD CONSTRAINT "cascades_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cascade_steps" ADD CONSTRAINT "cascade_steps_cascadeId_fkey" FOREIGN KEY ("cascadeId") REFERENCES "cascades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_cascadeId_fkey" FOREIGN KEY ("cascadeId") REFERENCES "cascades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "verification_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
