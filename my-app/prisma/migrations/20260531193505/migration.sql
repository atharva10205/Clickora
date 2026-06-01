/*
  Warnings:

  - You are about to drop the column `tx_signature` on the `EarningsRecord` table. All the data in the column will be lost.
  - Added the required column `advertiser_wallet` to the `EarningsRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EarningsRecord" DROP COLUMN "tx_signature",
ADD COLUMN     "advertiser_wallet" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "WithdrawalRecord" (
    "id" TEXT NOT NULL,
    "publisher_wallet" TEXT NOT NULL,
    "tx_signature" TEXT,
    "total_amount" INTEGER NOT NULL,
    "ad_ids" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "WithdrawalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversion" (
    "id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "revenue" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'purchase',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversion_pkey" PRIMARY KEY ("id")
);
