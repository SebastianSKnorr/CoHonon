-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'STORE', 'PRODUCT', 'CATEGORY', 'PREFERENCE', 'BEHAVIOR');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('VISITED', 'PURCHASED_FROM', 'PREFERRED', 'FOLLOWS', 'SIMILAR_TO', 'SEARCHED_FOR');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('BEHAVIOR', 'PREFERENCE', 'FACT', 'INTERACTION', 'INFERRED');

-- CreateEnum
CREATE TYPE "ObservationSource" AS ENUM ('TRANSACTION', 'INTERACTION', 'INFERENCE', 'MANUAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "character" JSONB,
ADD COLUMN     "consentAI" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEntity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRelation" (
    "id" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "type" "RelationType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "context" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserObservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT,
    "type" "ObservationType" NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" "ObservationSource" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "UserEntity_userId_idx" ON "UserEntity"("userId");

-- CreateIndex
CREATE INDEX "UserEntity_type_idx" ON "UserEntity"("type");

-- CreateIndex
CREATE UNIQUE INDEX "UserEntity_userId_type_name_key" ON "UserEntity"("userId", "type", "name");

-- CreateIndex
CREATE INDEX "UserRelation_sourceEntityId_idx" ON "UserRelation"("sourceEntityId");

-- CreateIndex
CREATE INDEX "UserRelation_targetEntityId_idx" ON "UserRelation"("targetEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelation_sourceEntityId_targetEntityId_type_key" ON "UserRelation"("sourceEntityId", "targetEntityId", "type");

-- CreateIndex
CREATE INDEX "UserObservation_userId_idx" ON "UserObservation"("userId");

-- CreateIndex
CREATE INDEX "UserObservation_entityId_idx" ON "UserObservation"("entityId");

-- CreateIndex
CREATE INDEX "UserObservation_type_idx" ON "UserObservation"("type");

-- CreateIndex
CREATE INDEX "UserObservation_createdAt_idx" ON "UserObservation"("createdAt");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntity" ADD CONSTRAINT "UserEntity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelation" ADD CONSTRAINT "UserRelation_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "UserEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelation" ADD CONSTRAINT "UserRelation_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "UserEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserObservation" ADD CONSTRAINT "UserObservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserObservation" ADD CONSTRAINT "UserObservation_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "UserEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
