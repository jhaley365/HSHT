/*
  Warnings:

  - You are about to drop the `invoice_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_invoice_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_activityDetailsId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_activityId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_billingCodeId_fkey";

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "student_invoice_items" DROP CONSTRAINT "student_invoice_items_activityDetailsId_fkey";

-- DropForeignKey
ALTER TABLE "student_invoice_items" DROP CONSTRAINT "student_invoice_items_activityId_fkey";

-- DropForeignKey
ALTER TABLE "student_invoice_items" DROP CONSTRAINT "student_invoice_items_billingCodeId_fkey";

-- DropForeignKey
ALTER TABLE "student_invoice_items" DROP CONSTRAINT "student_invoice_items_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "student_invoice_items" DROP CONSTRAINT "student_invoice_items_studentId_fkey";

-- DropTable
DROP TABLE "invoice_items";

-- DropTable
DROP TABLE "student_invoice_items";
