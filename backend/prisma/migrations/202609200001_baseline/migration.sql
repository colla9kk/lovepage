CREATE TABLE "Page" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "nomeCasal" TEXT NOT NULL,
  "dataInicio" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL,
  "fotoUrl" TEXT NOT NULL,
  "spotifyTrackId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
