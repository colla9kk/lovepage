import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const date = z.union([z.number(), z.string()]).transform(value => new Date(value));
const page = z.object({ id: z.string(), slug: z.string(), nomeCasal: z.string(), dataInicio: z.string(), mensagem: z.string(), fotoUrl: z.string(), spotifyTrackId: z.string().nullable(), createdAt: date, orderId: z.string().nullable().optional() });
const order = z.object({ id: z.string(), tokenHash: z.string(), payload: z.string(), payerEmail: z.string(), payerCpf: z.string(), amountCents: z.number(), paymentId: z.string().nullable(), status: z.string(), createdAt: date, updatedAt: date });
const prisma = new PrismaClient();
async function main() {
  if (!/^postgres(ql)?:/.test(process.env.DATABASE_URL || '')) throw new Error('Configure o PostgreSQL de destino em DATABASE_URL.');
  if (!process.argv[2]) throw new Error('Informe o arquivo .export.json.');
  const data = z.object({ Page: z.array(page), Order: z.array(order) }).parse(JSON.parse(readFileSync(process.argv[2], 'utf8')));
  await prisma.$transaction(async tx => {
    if (await tx.page.count() || await tx.order.count()) throw new Error('O destino precisa estar vazio. Nada foi sobrescrito.');
    for (const entry of data.Order) await tx.order.create({ data: entry });
    for (const entry of data.Page) await tx.page.create({ data: entry });
  }, { timeout: 120000 });
  console.log(`Importados ${data.Page.length} páginas e ${data.Order.length} pedidos, preservando IDs e slugs.`);
}
main().catch(() => { console.error('Importação falhou. Verifique o arquivo, o client PostgreSQL e se o destino está vazio. Nenhum dado foi sobrescrito.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
