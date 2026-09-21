import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createApp } from './app';
import { HttpError } from './checkout';
function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configure ${name} no ambiente do backend.`);
  return value;
}
const frontendUrl = new URL(required('FRONTEND_URL')).origin;
const priceCents = Number(process.env.PRICE_CENTS || 1990);
if (!Number.isInteger(priceCents) || priceCents < 1) throw new Error('PRICE_CENTS deve ser um número inteiro positivo em centavos.');
if (process.env.NODE_ENV === 'production' && !frontendUrl.startsWith('https://')) throw new Error('FRONTEND_URL deve usar HTTPS em produção.');
const prisma = new PrismaClient();
const payment = new Payment(new MercadoPagoConfig({ accessToken: required('MERCADO_PAGO_ACCESS_TOKEN'), options: { timeout: 15000 } }));
const webhookSecret = process.env.NODE_ENV === 'production' ? required('MERCADO_PAGO_WEBHOOK_SECRET') : process.env.MERCADO_PAGO_WEBHOOK_SECRET || '';
const notificationUrl = process.env.MERCADO_PAGO_NOTIFICATION_URL;
if (notificationUrl && new URL(notificationUrl).protocol !== 'https:') throw new Error('MERCADO_PAGO_NOTIFICATION_URL deve usar HTTPS.');
const { app, checkout } = createApp(prisma, {
  get: id => payment.get({ id }),
  create: async order => {
    try { return await payment.create({
    requestOptions: { idempotencyKey: order.id },
    body: {
      transaction_amount: order.amountCents / 100,
      description: 'LovePage - Presente romântico', payment_method_id: 'pix', external_reference: order.id,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      payer: { email: order.payerEmail, identification: { type: 'CPF', number: order.payerCpf } },
    },
  }); } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 0;
    if ([400, 422].includes(status)) throw new HttpError(422, 'Dados recusados pelo provedor.');
    throw error;
  }
  },
}, { frontendUrl, collectorId: required('MERCADO_PAGO_COLLECTOR_ID'), webhookSecret, trustProxy: Number(process.env.TRUST_PROXY_HOPS || 0), priceCents });
let reconciling = false;
const timer = setInterval(async () => {
  if (reconciling) return;
  reconciling = true;
  try {
    const orders = await prisma.order.findMany({
      where: { paymentId: { not: null }, page: null, status: { in: ['pending', 'in_process', 'authorized', 'approved'] } },
      orderBy: { updatedAt: 'asc' }, take: 20,
    });
    for (const order of orders) {
      try { await checkout.sync(order); } catch { console.error('Reconciliação será tentada novamente.'); }
    }
  } catch { console.error('Falha temporária na reconciliação.'); }
  finally { reconciling = false; }
}, 30000);
timer.unref();
const server = app.listen(Number(process.env.PORT || 5000), () => console.log('LovePage backend iniciado.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  clearInterval(timer);
  server.close(() => { void prisma.$disconnect().then(() => process.exit(0)); });
});
