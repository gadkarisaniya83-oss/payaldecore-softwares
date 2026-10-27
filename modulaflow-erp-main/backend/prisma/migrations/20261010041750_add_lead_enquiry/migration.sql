/*
  Warnings:

  - You are about to drop the column `mobileNumber` on the `lead_enquiries` table. All the data in the column will be lost.
  - You are about to drop the column `siteLocation` on the `lead_enquiries` table. All the data in the column will be lost.
  - The `status` column on the `lead_enquiries` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `phone` to the `lead_enquiries` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeadEnquiryStatus" AS ENUM ('New', 'Contacted', 'Qualified', 'Converted', 'Lost');

-- AlterTable
ALTER TABLE "lead_enquiries" DROP COLUMN "mobileNumber",
DROP COLUMN "siteLocation",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "source" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "LeadEnquiryStatus" NOT NULL DEFAULT 'New';

-- CreateIndex
CREATE INDEX "lead_enquiries_status_idx" ON "lead_enquiries"("status");

-- CreateIndex
CREATE INDEX "lead_enquiries_phone_idx" ON "lead_enquiries"("phone");
