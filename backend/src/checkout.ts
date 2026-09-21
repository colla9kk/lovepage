import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaClient, Order } from '@prisma/client';
import QRCode from 'qrcode';
import { CheckoutInput, pageInput } from './validation';

export type PaymentInfo = {
  id?: number | string; status?: string; transaction_amount?: number; currency_id?: string;
  collector_id?: number; external_reference?: string; payment_method_id?: string;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
};
export interface Gateway {
  create(order: Order): Promise<PaymentInfo>;
  get(id: string): Promise<PaymentInfo>;
}
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function authorize(order: Order | null, token: string) {
  if (!order || !/^[a-f0-9]{64}$/.test(token) || !timingSafeEqual(Buffer.from(order.tokenHash, 'hex'), Buffer.from(hashToken(token), 'hex'))) {
    throw new HttpError(404, 'Pedido não encontrado.');
  }
  return order;
}

export function createCheckout(prisma: PrismaClient, gateway: Gateway, config: { frontendUrl: string; collectorId: string; priceCents?: number }) {
  async function save(input: CheckoutInput, token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new HttpError(400, 'Chave de recuperação inválida.');
    const existing = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (existing) return authorize(existing, token);
    try {
      return await prisma.order.create({ data: {
        id: input.orderId, tokenHash: hashToken(token), payload: JSON.stringify(pageInput.parse(input)),
        payerEmail: input.email, payerCpf: input.cpf, amountCents: config.priceCents ?? 1990,
      } });
    } catch (error) {
      const raced = await prisma.order.findUnique({ where: { id: input.orderId } });
      if (raced) return authorize(raced, token);
      throw error;
    }
  }
  function verify(order: Order, info: PaymentInfo) {
    if (!info.id || (order.paymentId && String(info.id) !== order.paymentId) ||
        info.external_reference !== order.id || info.currency_id !== 'BRL' ||
        info.transaction_amount !== order.amountCents / 100 ||
        String(info.collector_id) !== config.collectorId || info.payment_method_id !== 'pix') {
      throw new HttpError(502, 'Não foi possível validar o pagamento deste pedido.');
    }
  }
  async function sync(order: Order) {
    if (!order.paymentId && order.status === 'rejected') return {
      orderId: order.id, paymentId: null, status: 'rejected', isApproved: false,
      result: null, qrCodeBase64: null, qrCodeCopiaCola: '', pageData: JSON.parse(order.payload),
    };
    // A persisted UUID is also the provider idempotency key, including retries after a timeout.
    let info: PaymentInfo;
    try { info = order.paymentId ? await gateway.get(order.paymentId) : await gateway.create(order); }
    catch (error) {
      if (!order.paymentId && error instanceof HttpError && error.status === 422) {
        const rejected = await prisma.order.update({ where: { id: order.id }, data: { status: 'rejected', payerCpf: '', payerEmail: '' } });
        return sync(rejected);
      }
      throw error;
    }
    verify(order, info);
    await prisma.order.update({ where: { id: order.id }, data: { paymentId: String(info.id), status: info.status || 'pending' } });
    if (info.status === 'approved') {
      const payload = pageInput.parse(JSON.parse(order.payload));
      const base = payload.nomeCasal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'casal';
      try {
        await prisma.$transaction(async tx => {
          await tx.page.upsert({
            where: { orderId: order.id }, update: {},
            create: { ...payload, orderId: order.id, slug: `${base}-${randomUUID()}` },
          });
          // The provider no longer needs payer details after payment approval.
          await tx.order.update({ where: { id: order.id }, data: { payerCpf: '', payerEmail: '' } });
        });
      } catch (error) {
        if (!await prisma.page.findUnique({ where: { orderId: order.id } })) throw error;
      }
    }
    const page = await prisma.page.findUnique({ where: { orderId: order.id } });
    const url = page ? `${config.frontendUrl}/p/${page.slug}` : null;
    return {
      pageData: JSON.parse(order.payload),
      orderId: order.id, paymentId: String(info.id), status: info.status || 'pending',
      isApproved: info.status === 'approved',
      // A successful payment alone is never reported as delivered.
      result: url && info.status === 'approved' ? { url, qrCode: await QRCode.toDataURL(url, { width: 1200, margin: 4 }) } : null,
      qrCodeBase64: info.point_of_interaction?.transaction_data?.qr_code_base64 ? `data:image/png;base64,${info.point_of_interaction.transaction_data.qr_code_base64}` : null,
      qrCodeCopiaCola: info.point_of_interaction?.transaction_data?.qr_code || '',
    };
  }
  async function get(id: string, token: string) {
    return sync(authorize(await prisma.order.findUnique({ where: { id } }), token));
  }
  return { save, sync, get };
}
