-- AlterTable
ALTER TABLE "Click" ADD COLUMN     "claimable_amount" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CLickEarningRecord" (
    "id" SERIAL NOT NULL,
    "publisher_id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "claimable_amount" BIGINT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CLickEarningRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CLickEarningRecord_publisher_id_ad_id_key" ON "CLickEarningRecord"("publisher_id", "ad_id");
