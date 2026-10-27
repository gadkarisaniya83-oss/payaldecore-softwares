-- CreateTable
CREATE TABLE "lead_enquiries" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "companyName" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "siteLocation" TEXT,
    "requirement" TEXT,
    "followUpDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_enquiries_status_idx" ON "lead_enquiries"("status");
