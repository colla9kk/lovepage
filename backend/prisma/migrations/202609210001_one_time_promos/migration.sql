-- Add a nullable unique reservation for one-time promo codes.
ALTER TABLE "Order" ADD COLUMN "promoCodeHash" TEXT;

CREATE UNIQUE INDEX "Order_promoCodeHash_key" ON "Order"("promoCodeHash");
