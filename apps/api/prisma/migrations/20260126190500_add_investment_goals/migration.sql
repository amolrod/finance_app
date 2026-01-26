-- CreateEnum
CREATE TYPE "investment_goal_scope" AS ENUM ('PORTFOLIO', 'ASSET');

-- CreateTable
CREATE TABLE "investment_goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "scope" "investment_goal_scope" NOT NULL DEFAULT 'PORTFOLIO',
    "asset_id" UUID,
    "target_amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "target_date" TIMESTAMPTZ,
    "alert_at_80" BOOLEAN NOT NULL DEFAULT true,
    "alert_at_100" BOOLEAN NOT NULL DEFAULT true,
    "alert_80_sent" BOOLEAN NOT NULL DEFAULT false,
    "alert_100_sent" BOOLEAN NOT NULL DEFAULT false,
    "achieved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "investment_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investment_goals_user_id_idx" ON "investment_goals"("user_id");

-- CreateIndex
CREATE INDEX "investment_goals_asset_id_idx" ON "investment_goals"("asset_id");

-- AddForeignKey
ALTER TABLE "investment_goals" ADD CONSTRAINT "investment_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_goals" ADD CONSTRAINT "investment_goals_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
