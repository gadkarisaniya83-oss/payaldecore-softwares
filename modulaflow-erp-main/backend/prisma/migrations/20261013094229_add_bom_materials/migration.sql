-- CreateEnum
CREATE TYPE "BOMStatus" AS ENUM ('Draft', 'Approved', 'InProduction', 'Completed', 'Cancelled');

-- CreateTable
CREATE TABLE "bill_of_materials" (
    "id" TEXT NOT NULL,
    "bomNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BOMStatus" NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "projectId" TEXT,
    "workOrderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT NOT NULL,
    "requiredQty" DOUBLE PRECISION NOT NULL,
    "availableQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bill_of_materials_bomNo_key" ON "bill_of_materials"("bomNo");

-- CreateIndex
CREATE INDEX "bill_of_materials_projectId_idx" ON "bill_of_materials"("projectId");

-- CreateIndex
CREATE INDEX "bill_of_materials_workOrderId_idx" ON "bill_of_materials"("workOrderId");

-- CreateIndex
CREATE INDEX "bill_of_materials_status_idx" ON "bill_of_materials"("status");

-- CreateIndex
CREATE INDEX "bom_items_bomId_idx" ON "bom_items"("bomId");

-- CreateIndex
CREATE INDEX "bom_items_materialCode_idx" ON "bom_items"("materialCode");

-- CreateIndex
CREATE INDEX "bom_items_materialName_idx" ON "bom_items"("materialName");

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
