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
  cancel(id: string, idempotencyKey: string): Promise<PaymentInfo>;
}
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const ONE_TIME_PROMOS = new Map<string, number>([
  ['18ff73a2155e1812d12502006edb91b563db904bda1f3f06a92e3c25423387f4', 1000],
]);

function promotionFromCode(code?: string) {
  if (!code) return null;
  const hash = hashToken(code);
  const amountCents = ONE_TIME_PROMOS.get(hash);
  return amountCents ? { hash, amountCents } : null;
}

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

    const promotion = input.promoCode ? promotionFromCode(input.promoCode) : null;
    if (input.promoCode && !promotion) throw new HttpError(400, 'Link promocional inválido.');
    if (promotion) {
      const reserved = await prisma.order.findUnique({ where: { promoCodeHash: promotion.hash } });
      if (reserved) throw new HttpError(409, 'Esta promoção de uso único já foi utilizada ou está reservada.');
    }

    try {
      return await prisma.order.create({ data: {
        id: input.orderId,
        tokenHash: hashToken(token),
        payload: JSON.stringify(pageInput.parse(input)),
        payerEmail: input.email,
        payerCpf: input.cpf,
        amountCents: promotion?.amountCents ?? config.priceCents ?? 1990,
        promoCodeHash: promotion?.hash ?? null,
      } });
    } catch (error) {
      const raced = await prisma.order.findUnique({ where: { id: input.orderId } });
      if (raced) return authorize(raced, token);
      if (promotion && await prisma.order.findUnique({ where: { promoCodeHash: promotion.hash } })) {
        throw new HttpError(409, 'Esta promoção de uso único já foi utilizada ou está reservada.');
      }
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
      orderId: order.id, paymentId: null, status: 'rejected', isApproved: false, amountCents: order.amountCents,
      result: null, qrCodeBase64: null, qrCodeCopiaCola: '', pageData: JSON.parse(order.payload),
    };
    // A persisted UUID is also the provider idempotency key, including retries after a timeout.
    let info: PaymentInfo;
    try { info = order.paymentId ? await gateway.get(order.paymentId) : await gateway.create(order); }
    catch (error) {
      if (!order.paymentId && error instanceof HttpError && error.status === 422) {
        const rejected = await prisma.order.update({ where: { id: order.id }, data: { status: 'rejected', payerCpf: '', payerEmail: '', promoCodeHash: null } });
        return sync(rejected);
      }
      throw error;
    }
    verify(order, info);
    const status = info.status || 'pending';
    const releasesPromo = ['cancelled', 'canceled', 'rejected', 'refunded', 'charged_back'].includes(status);
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: String(info.id), status, ...(releasesPromo ? { promoCodeHash: null } : {}) },
    });
    if (info.status === 'approved') {
      const payload = pageInput.parse(JSON.parse(order.payload));
      const photos = payload.fotoUrls?.length ? payload.fotoUrls : [payload.fotoUrl];
      const base = payload.nomeCasal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'casal';
      try {
        await prisma.$transaction(async tx => {
          await tx.page.upsert({
            where: { orderId: order.id }, update: {},
            create: {
              nomeCasal: payload.nomeCasal,
              dataInicio: payload.dataInicio,
              mensagem: payload.mensagem,
              fotoUrl: photos.length === 1 ? photos[0] : JSON.stringify(photos),
              spotifyTrackId: payload.spotifyTrackId,
              theme: payload.theme,
              extraData: JSON.stringify({
                relationLabel: payload.relationLabel,
                highlights: payload.highlights,
              }),
              orderId: order.id,
              slug: `${base}-${randomUUID()}`,
            },
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
      isApproved: info.status === 'approved', amountCents: order.amountCents,
      // A successful payment alone is never reported as delivered.
      result: url && info.status === 'approved' ? { url, qrCode: await QRCode.toDataURL(url, { width: 1200, margin: 4 }) } : null,
      qrCodeBase64: info.point_of_interaction?.transaction_data?.qr_code_base64 ? `data:image/png;base64,${info.point_of_interaction.transaction_data.qr_code_base64}` : null,
      qrCodeCopiaCola: info.point_of_interaction?.transaction_data?.qr_code || '',
    };
  }
  async function get(id: string, token: string) {
    return sync(authorize(await prisma.order.findUnique({ where: { id } }), token));
  }

  async function cancel(id: string, token: string) {
    let order = authorize(await prisma.order.findUnique({ where: { id } }), token);
    if (await prisma.page.findUnique({ where: { orderId: order.id } }) || order.status === 'approved') {
      throw new HttpError(409, 'Este pagamento já foi aprovado e o presente já está sendo entregue.');
    }
    if (['cancelled', 'rejected', 'refunded', 'charged_back'].includes(order.status)) {
      return { orderId: order.id, status: order.status };
    }

    // If charge creation previously timed out, retry idempotently first so we can
    // recover the provider payment id before trying to cancel it.
    if (!order.paymentId) {
      await sync(order);
      order = authorize(await prisma.order.findUnique({ where: { id } }), token);
      if (await prisma.page.findUnique({ where: { orderId: order.id } }) || order.status === 'approved') {
        throw new HttpError(409, 'Este pagamento já foi aprovado e não pode mais ser cancelado.');
      }
    }

    if (order.paymentId) {
      let info: PaymentInfo;
      try {
        info = await gateway.cancel(order.paymentId, `${order.id}:cancel`);
      } catch (error) {
        // The payment may have changed state between the last poll and the cancel request.
        const current = await gateway.get(order.paymentId);
        if (current.status === 'approved') {
          await sync(order);
          throw new HttpError(409, 'O pagamento foi aprovado antes do cancelamento.');
        }
        throw error;
      }
      verify(order, info);
      if (!['cancelled', 'canceled'].includes(info.status || '')) throw new HttpError(502, 'O provedor não confirmou o cancelamento do PIX.');
    }

    const cancelled = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled', payerCpf: '', payerEmail: '', promoCodeHash: null },
    });
    return { orderId: cancelled.id, status: cancelled.status };
  }

  async function promoInfo(code: string, orderId?: string) {
    const promotion = promotionFromCode(code);
    if (!promotion) return null;
    const reserved = await prisma.order.findUnique({
      where: { promoCodeHash: promotion.hash },
      select: { id: true, status: true },
    });
    return {
      valid: true,
      available: !reserved || reserved.id === orderId,
      amountCents: promotion.amountCents,
      status: reserved?.status || null,
    };
  }

  return { save, sync, get, cancel, promoInfo };
}
