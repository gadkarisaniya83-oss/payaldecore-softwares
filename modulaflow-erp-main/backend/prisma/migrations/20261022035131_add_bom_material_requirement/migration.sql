-- CreateTable
CREATE TABLE "boms" (
    "id" TEXT NOT NULL,
    "bomNo" TEXT NOT NULL,
    "bomName" TEXT NOT NULL,
    "project" TEXT,
    "workOrderNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_materials" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL DEFAULT '',
    "materialName" TEXT NOT NULL,
    "requiredQty" DOUBLE PRECISION NOT NULL,
    "availableQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'Pieces',
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boms_bomNo_key" ON "boms"("bomNo");

-- CreateIndex
CREATE INDEX "boms_workOrderNo_idx" ON "boms"("workOrderNo");

-- CreateIndex
CREATE INDEX "boms_status_idx" ON "boms"("status");

-- CreateIndex
CREATE INDEX "bom_materials_bomId_idx" ON "bom_materials"("bomId");

-- CreateIndex
CREATE INDEX "bom_materials_materialCode_idx" ON "bom_materials"("materialCode");

-- AddForeignKey
ALTER TABLE "bom_materials" ADD CONSTRAINT "bom_materials_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
