-- CreateTable
CREATE TABLE "ProductionJob" (
    "id" TEXT NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "currentStage" TEXT NOT NULL DEFAULT 'Pending',
    "department" TEXT NOT NULL DEFAULT 'Production',
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJob_workOrderNo_key" ON "ProductionJob"("workOrderNo");

-- CreateIndex
CREATE INDEX "ProductionJob_currentStage_idx" ON "ProductionJob"("currentStage");

-- CreateIndex
CREATE INDEX "ProductionJob_deadline_idx" ON "ProductionJob"("deadline");
