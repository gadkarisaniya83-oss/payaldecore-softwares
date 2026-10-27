-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('Draft', 'Approved', 'InProduction', 'Completed', 'Cancelled');

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "notes" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_workOrderNo_key" ON "work_orders"("workOrderNo");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_customer_idx" ON "work_orders"("customer");

-- CreateIndex
CREATE INDEX "work_orders_project_idx" ON "work_orders"("project");

-- CreateIndex
CREATE INDEX "work_orders_dueDate_idx" ON "work_orders"("dueDate");
