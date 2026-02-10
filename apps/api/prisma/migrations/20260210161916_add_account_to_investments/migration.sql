-- AlterTable
ALTER TABLE "investment_operations" ADD COLUMN     "account_id" UUID;

-- CreateIndex
CREATE INDEX "investment_operations_user_id_account_id_idx" ON "investment_operations"("user_id", "account_id");

-- AddForeignKey
ALTER TABLE "investment_operations" ADD CONSTRAINT "investment_operations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
