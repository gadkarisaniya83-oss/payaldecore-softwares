-- DropIndex
DROP INDEX "ProductionJob_workOrderNo_key";

-- CreateIndex
CREATE INDEX "ProductionJob_workOrderNo_idx" ON "ProductionJob"("workOrderNo");
