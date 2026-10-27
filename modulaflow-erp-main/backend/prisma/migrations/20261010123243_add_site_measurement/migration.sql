-- CreateTable
CREATE TABLE "SiteMeasurement" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "leadId" TEXT,
    "projectName" TEXT,
    "siteAddress" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT,
    "roomType" TEXT NOT NULL,
    "furnitureType" TEXT,
    "lengthMm" DOUBLE PRECISION,
    "widthMm" DOUBLE PRECISION,
    "heightMm" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'mm',
    "customerNotes" TEXT,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteMeasurement_visitId_key" ON "SiteMeasurement"("visitId");

-- CreateIndex
CREATE INDEX "SiteMeasurement_customerName_idx" ON "SiteMeasurement"("customerName");

-- CreateIndex
CREATE INDEX "SiteMeasurement_visitDate_idx" ON "SiteMeasurement"("visitDate");

-- CreateIndex
CREATE INDEX "SiteMeasurement_status_idx" ON "SiteMeasurement"("status");
