ALTER TABLE "Page" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'romantic';

CREATE TABLE "MetricEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "orderId" TEXT,
  "pageSlug" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MetricEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MetricEvent_type_createdAt_idx" ON "MetricEvent"("type", "createdAt");
CREATE INDEX "MetricEvent_createdAt_idx" ON "MetricEvent"("createdAt");
