-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "AmountNull" BOOLEAN;

-- AlterTable
ALTER TABLE "Publisher" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
