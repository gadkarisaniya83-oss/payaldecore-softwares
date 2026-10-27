/*
  Warnings:

  - You are about to drop the `lead_enquiries` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "lead_enquiries";

-- CreateTable
CREATE TABLE "LeadEnquiry" (
    "id" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'Direct',
    "requirement" TEXT NOT NULL,
    "budget" TEXT NOT NULL DEFAULT '',
    "followUpDate" DATE,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadEnquiry_status_idx" ON "LeadEnquiry"("status");

-- CreateIndex
CREATE INDEX "LeadEnquiry_customerName_idx" ON "LeadEnquiry"("customerName");
