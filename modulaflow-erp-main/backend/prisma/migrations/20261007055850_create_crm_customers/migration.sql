-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('Lead', 'Active', 'Inactive');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "location" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'Active',
    "projects" INTEGER NOT NULL DEFAULT 0,
    "businessValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gstin" TEXT,
    "address" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "contactPerson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_company_idx" ON "customers"("company");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");
