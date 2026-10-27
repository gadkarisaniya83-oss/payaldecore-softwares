-- AlterTable
ALTER TABLE "ProductionJob" ADD COLUMN     "bomId" TEXT;

-- CreateIndex
CREATE INDEX "ProductionJob_bomId_idx" ON "ProductionJob"("bomId");

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
