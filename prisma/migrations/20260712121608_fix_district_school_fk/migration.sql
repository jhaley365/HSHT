/*
  Warnings:

  - You are about to drop the column `districtId` on the `districts` table. All the data in the column will be lost.
  - Added the required column `code` to the `districts` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `districtId` on the `schools` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "schools" DROP CONSTRAINT "schools_districtId_fkey";

-- DropIndex
DROP INDEX "districts_districtId_key";

-- DropIndex
DROP INDEX "schools_schoolCode_key";

-- AlterTable
ALTER TABLE "districts" DROP COLUMN "districtId",
ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "districtId",
ADD COLUMN     "districtId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "districts_code_idx" ON "districts"("code");

-- CreateIndex
CREATE INDEX "schools_districtId_idx" ON "schools"("districtId");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("legacyId") ON DELETE RESTRICT ON UPDATE CASCADE;
