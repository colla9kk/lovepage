ALTER TABLE "Page" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'romantic';

CREATE TABLE "MetricEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "orderId" TEXT,
  "pageSlug" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MetricEvent_type_createdAt_idx" ON "MetricEvent"("type", "createdAt");
CREATE INDEX "MetricEvent_createdAt_idx" ON "MetricEvent"("createdAt");
