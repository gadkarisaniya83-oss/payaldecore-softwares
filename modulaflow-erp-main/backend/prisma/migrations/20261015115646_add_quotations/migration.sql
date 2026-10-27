/*
  Warnings:

  - You are about to drop the `bill_of_materials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bom_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bill_of_materials" DROP CONSTRAINT "bill_of_materials_projectId_fkey";

-- DropForeignKey
ALTER TABLE "bill_of_materials" DROP CONSTRAINT "bill_of_materials_workOrderId_fkey";

-- DropForeignKey
ALTER TABLE "bom_items" DROP CONSTRAINT "bom_items_bomId_fkey";

-- DropTable
DROP TABLE "bill_of_materials";

-- DropTable
DROP TABLE "bom_items";

-- DropTable
DROP TABLE "projects";

-- DropTable
DROP TABLE "work_orders";

-- DropEnum
DROP TYPE "BOMStatus";

-- CreateTable
CREATE TABLE "Estimation" (
    "id" TEXT NOT NULL,
    "estimationNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadEnquiryId" INTEGER NOT NULL,
    "siteMeasurementId" TEXT NOT NULL,
    "projectName" TEXT,
    "notes" TEXT,
    "lengthMm" DOUBLE PRECISION NOT NULL,
    "widthMm" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mm',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "wastagePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratePerSqft" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricingMethod" TEXT NOT NULL DEFAULT 'markup',
    "pricingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "edges" JSONB NOT NULL,
    "bomItems" JSONB NOT NULL,
    "derivedQuantities" JSONB NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellingPricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estimation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "estimateId" TEXT,
    "quotationDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "notes" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'NOS',
    "rate" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estimation_estimationNumber_key" ON "Estimation"("estimationNumber");

-- CreateIndex
CREATE INDEX "Estimation_customerId_idx" ON "Estimation"("customerId");

-- CreateIndex
CREATE INDEX "Estimation_leadEnquiryId_idx" ON "Estimation"("leadEnquiryId");

-- CreateIndex
CREATE INDEX "Estimation_siteMeasurementId_idx" ON "Estimation"("siteMeasurementId");

-- CreateIndex
CREATE INDEX "Estimation_createdAt_idx" ON "Estimation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNo_key" ON "quotations"("quotationNo");

-- CreateIndex
CREATE INDEX "quotations_customerId_idx" ON "quotations"("customerId");

-- CreateIndex
CREATE INDEX "quotations_estimateId_idx" ON "quotations"("estimateId");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- AddForeignKey
ALTER TABLE "Estimation" ADD CONSTRAINT "Estimation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimation" ADD CONSTRAINT "Estimation_leadEnquiryId_fkey" FOREIGN KEY ("leadEnquiryId") REFERENCES "LeadEnquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimation" ADD CONSTRAINT "Estimation_siteMeasurementId_fkey" FOREIGN KEY ("siteMeasurementId") REFERENCES "SiteMeasurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
