-- CreateEnum
CREATE TYPE "Program" AS ENUM ('HSHT', 'YTEP');

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "program" "Program" NOT NULL DEFAULT 'HSHT';

-- AlterTable
ALTER TABLE "student_archive" ADD COLUMN     "mid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "program" "Program" NOT NULL DEFAULT 'HSHT';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "mid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "program" "Program" NOT NULL DEFAULT 'HSHT';
