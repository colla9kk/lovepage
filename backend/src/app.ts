import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import { checkoutInput } from './validation';
import { createCheckout, Gateway, HttpError } from './checkout';
import { validSignature } from './webhook';
export function createApp(prisma: PrismaClient, gateway: Gateway, config: { frontendUrl: string; collectorId: string; webhookSecret: string; trustProxy?: number; checkoutLimit?: number; priceCents?: number }) {
  const app = express();
  const checkout = createCheckout(prisma, gateway, config);
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.use(cors({ origin: config.frontendUrl, allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use(express.json({ limit: '16mb' }));
  app.use('/api/checkout', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api/checkout', rateLimit({ windowMs: 60000, limit: 90, standardHeaders: 'draft-7', legacyHeaders: false }));
  const token = (req: express.Request) => req.get('authorization')?.replace(/^Bearer /, '') || '';
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
      nomeCasal: true, dataInicio: true, mensagem: true, fotoUrl: true, spotifyTrackId: true, slug: true,
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
