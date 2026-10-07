-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('InProgress', 'Pending', 'Completed');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "site" TEXT,
    "projectLead" TEXT,
    "measuredArea" TEXT,
    "targetDate" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "ProjectStatus" NOT NULL DEFAULT 'InProgress',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_customer_idx" ON "projects"("customer");
