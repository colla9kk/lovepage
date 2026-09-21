import express, { ErrorRequestHandler } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import { checkoutInput } from './validation';
import { createCheckout, Gateway, HttpError } from './checkout';
import { validSignature } from './webhook';
export function createApp(prisma: PrismaClient, gateway: Gateway, config: {
  frontendUrl: string;
  collectorId: string;
  webhookSecret: string;
  trustProxy?: number;
  checkoutLimit?: number;
  priceCents?: number;
  adminPassword?: string;
}) {
  const app = express();
  const checkout = createCheckout(prisma, gateway, config);
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.use(cors({ origin: config.frontendUrl, allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use(express.json({ limit: '16mb' }));
  app.use('/api/checkout', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api/checkout', rateLimit({ windowMs: 60000, limit: 90, standardHeaders: 'draft-7', legacyHeaders: false }));
  const token = (req: express.Request) => req.get('authorization')?.replace(/^Bearer /, '') || '';
  const sameSecret = (received: string, expected: string) => {
    const left = createHash('sha256').update(received).digest();
    const right = createHash('sha256').update(expected).digest();
    return timingSafeEqual(left, right);
  };
  const requireAdmin: express.RequestHandler = (req, res, next) => {
    if (!config.adminPassword) {
      res.status(503).json({ error: 'Painel administrativo ainda não foi ativado.' });
      return;
    }
    if (!sameSecret(token(req), config.adminPassword)) {
      res.status(401).json({ error: 'Senha administrativa inválida.' });
      return;
    }
    next();
  };
  const photosFromStoredValue = (value: string) => {
    if (!value.startsWith('[')) return [value];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') && parsed.length ? parsed.slice(0, 10) : [value];
    } catch {
      return [value];
    }
  };
  app.get('/health', async (_req, res) => { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true }); });

  const metricTypes = new Set(['landing_view', 'checkout_click', 'page_view', 'whatsapp_share']);
  app.post('/api/metrics', rateLimit({ windowMs: 60000, limit: 120 }), async (req, res) => {
    const type = typeof req.body?.type === 'string' ? req.body.type : '';
    const orderId = typeof req.body?.orderId === 'string' && req.body.orderId.length <= 80 ? req.body.orderId : null;
    const pageSlug = typeof req.body?.pageSlug === 'string' && req.body.pageSlug.length <= 160 ? req.body.pageSlug : null;
    if (!metricTypes.has(type)) {
      res.status(400).json({ error: 'Métrica inválida.' });
      return;
    }
    await prisma.metricEvent.create({ data: { type, orderId, pageSlug } });
    res.status(204).end();
  });

  app.get('/api/admin/dashboard', rateLimit({ windowMs: 60000, limit: 30 }), requireAdmin, async (_req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalOrders,
      approvedOrders,
      pendingOrders,
      cancelledOrders,
      revenue,
      pages,
      groupedMetrics,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'approved' } }),
      prisma.order.count({ where: { status: { in: ['pending', 'in_process', 'authorized'] } } }),
      prisma.order.count({ where: { status: { in: ['cancelled', 'canceled', 'rejected', 'refunded', 'charged_back'] } } }),
      prisma.order.aggregate({ where: { status: 'approved' }, _sum: { amountCents: true } }),
      prisma.page.count(),
      prisma.metricEvent.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          status: true,
          amountCents: true,
          paymentId: true,
          createdAt: true,
          updatedAt: true,
          payload: true,
          page: { select: { slug: true, theme: true } },
        },
      }),
    ]);

    const metrics = Object.fromEntries(groupedMetrics.map(item => [item.type, item._count._all]));
    const orders = recentOrders.map(order => {
      let nomeCasal = '—';
      try {
        const parsed = JSON.parse(order.payload);
        if (typeof parsed?.nomeCasal === 'string') nomeCasal = parsed.nomeCasal;
      } catch {}
      return {
        id: order.id,
        status: order.status,
        amountCents: order.amountCents,
        paymentId: order.paymentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        nomeCasal,
        pageSlug: order.page?.slug || null,
        theme: order.page?.theme || null,
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      summary: {
        totalOrders,
        approvedOrders,
        pendingOrders,
        cancelledOrders,
        pages,
        revenueCents: revenue._sum.amountCents || 0,
      },
      metrics30d: {
        landingViews: metrics.landing_view || 0,
        checkoutClicks: metrics.checkout_click || 0,
        pageViews: metrics.page_view || 0,
        whatsappShares: metrics.whatsapp_share || 0,
      },
      orders,
    });
  });

  app.post('/api/checkout/pix', rateLimit({ windowMs: 60000, limit: config.checkoutLimit ?? 10 }), async (req, res) => {
    const order = await checkout.save(checkoutInput.parse(req.body), token(req));
    res.json({ success: true, ...await checkout.sync(order) });
  });
  app.get('/api/checkout/orders/:orderId', async (req, res) => {
    res.json({ success: true, ...await checkout.get(req.params.orderId, token(req)) });
  });
  app.post('/api/checkout/orders/:orderId/cancel', async (req, res) => {
    res.json({ success: true, ...await checkout.cancel(req.params.orderId, token(req)) });
  });
  app.post('/api/pages', (_req, res) => { res.status(410).json({ error: 'A página é criada automaticamente após a confirmação do pedido.' }); });
  app.get('/api/checkout/status/:paymentId', (_req, res) => { res.status(410).json({ error: 'Utilize a consulta autenticada do pedido.' }); });
  app.get('/api/pages/:slug', async (req, res) => {
    const page = await prisma.page.findUnique({ where: { slug: req.params.slug }, select: {
      nomeCasal: true, dataInicio: true, mensagem: true, fotoUrl: true, spotifyTrackId: true, theme: true, slug: true,
    } });
    if (!page) { res.status(404).json({ error: 'Página não encontrada.' }); return; }
    const fotoUrls = photosFromStoredValue(page.fotoUrl);
    res.json({ ...page, fotoUrl: fotoUrls[0], fotoUrls });
  });
  app.get('/api/pages/:slug/photo', async (req, res) => {
    const page = await prisma.page.findUnique({ where: { slug: req.params.slug }, select: { fotoUrl: true } });
    if (!page) { res.status(404).end(); return; }

    const firstPhoto = photosFromStoredValue(page.fotoUrl)[0];
    const dataImage = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(firstPhoto);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (dataImage) {
      res.type(dataImage[1]).send(Buffer.from(dataImage[2], 'base64'));
      return;
    }
    res.redirect(302, firstPhoto);
  });
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    const id = typeof req.query['data.id'] === 'string' ? req.query['data.id'] : '';
    if (!config.webhookSecret || !validSignature(config.webhookSecret, req.get('x-signature') || '', req.get('x-request-id') || '', id)) {
      res.status(401).json({ error: 'Assinatura inválida.' }); return;
    }
    const info = await gateway.get(id);
    if (info.external_reference) {
      const order = await prisma.order.findUnique({ where: { id: info.external_reference } });
      if (order) await checkout.sync(order);
    }
    res.sendStatus(200);
  });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) { res.status(400).json({ error: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(' ') }); return; }
    if (error instanceof HttpError) { res.status(error.status).json({ error: error.message }); return; }
    if (error.type === 'entity.too.large') { res.status(413).json({ error: 'As fotos ficaram grandes demais. Tente imagens menores ou em menor quantidade.' }); return; }
    if (error.type === 'entity.parse.failed') { res.status(400).json({ error: 'JSON inválido.' }); return; }
    console.error('Falha ao processar pedido:', error instanceof Error ? error.name : 'GatewayError');
    res.status(503).json({ error: 'Não foi possível concluir agora. Seu pedido pode ser recuperado; tente novamente.' });
  };
  app.use(errors);
  return { app, checkout };
}
