CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenHash" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "payerEmail" TEXT NOT NULL,
  "payerCpf" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL DEFAULT 1990,
  "paymentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
ALTER TABLE "Page" ADD COLUMN "orderId" TEXT REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Page_orderId_key" ON "Page"("orderId");
CREATE UNIQUE INDEX "Order_paymentId_key" ON "Order"("paymentId");
CREATE INDEX "Order_status_updatedAt_idx" ON "Order"("status", "updatedAt");
