-- AlterTable
ALTER TABLE "LeadEnquiry" ADD COLUMN     "customerId" VARCHAR(255);

-- AlterTable
ALTER TABLE "SiteMeasurement" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "leadEnquiryId" INTEGER;

-- CreateIndex
CREATE INDEX "LeadEnquiry_customerId_idx" ON "LeadEnquiry"("customerId");

-- CreateIndex
CREATE INDEX "SiteMeasurement_customerId_idx" ON "SiteMeasurement"("customerId");

-- CreateIndex
CREATE INDEX "SiteMeasurement_leadEnquiryId_idx" ON "SiteMeasurement"("leadEnquiryId");

-- AddForeignKey
ALTER TABLE "LeadEnquiry" ADD CONSTRAINT "LeadEnquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMeasurement" ADD CONSTRAINT "SiteMeasurement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMeasurement" ADD CONSTRAINT "SiteMeasurement_leadEnquiryId_fkey" FOREIGN KEY ("leadEnquiryId") REFERENCES "LeadEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
