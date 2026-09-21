import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';
import { PaymentInfo, HttpError } from '../src/checkout';
import { validSignature } from '../src/webhook';
import type { Server } from 'node:http';

const dir = mkdtempSync(`${tmpdir()}/lovepage-`);
const databaseUrl = `file:${dir}/test.db`;
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const payments = new Map<string, PaymentInfo>();
let createCalls = 0;
let failAfterCreate = false;
let rejectCreation = false;
const { app } = createApp(prisma, {
  async create(order) {
    createCalls++;
    if (rejectCreation) throw new HttpError(422, 'Rejected payer');
    let info = payments.get(order.id);
    if (!info) {
      info = { id: String(payments.size + 1), status: 'pending', transaction_amount: 19.9, currency_id: 'BRL', collector_id: 123,
        external_reference: order.id, payment_method_id: 'pix', point_of_interaction: { transaction_data: { qr_code: 'mock-pix', qr_code_base64: 'bW9jaw==' } } };
      payments.set(order.id, info);
    }
    if (failAfterCreate) { failAfterCreate = false; throw new Error('Timeout after provider accepted payment'); }
    return info;
  },
  async get(id) {
    const info = [...payments.values()].find(payment => payment.id === id);
    if (!info) throw new Error('Not found');
    return info;
  },
  async cancel(id) {
    const info = [...payments.values()].find(payment => payment.id === id);
    if (!info) throw new Error('Not found');
    if (info.status === 'approved') throw new Error('Cannot cancel approved');
    info.status = 'cancelled';
    return info;
  },
}, { frontendUrl: 'https://love.example', collectorId: '123', webhookSecret: 'test-secret', checkoutLimit: 100 });
let server: Server;
let base: string;
before(async () => {
  writeFileSync(`${dir}/test.db`, '');
  execFileSync('node', ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'pipe' });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
beforeEach(async () => { await prisma.page.deleteMany(); await prisma.order.deleteMany(); payments.clear(); createCalls = 0; failAfterCreate = false; rejectCreation = false; });
after(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); await prisma.$disconnect(); rmSync(dir, { recursive: true }); });
function draft() {
  return { orderId: randomUUID(), email: 'buyer@example.com', cpf: '11144477735', nomeCasal: 'Ana & João', dataInicio: '2024-01-01', mensagem: 'Te amo', fotoUrl: 'https://example.com/photo.jpg', spotifyTrackId: '' };
}
function request(path: string, token: string, body?: unknown) {
  return fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
const token = () => randomBytes(32).toString('hex');

test('blocks unpaid publishing and private order access; pending never creates a page', async () => {
  const input = draft(); const key = token();
  assert.equal((await request('/api/pages', key, input)).status, 410);
  const created = await request('/api/checkout/pix', key, input);
  assert.equal(created.status, 200); assert.equal((await created.json()).result, null);
  assert.equal(await prisma.page.count(), 0);
  assert.equal((await request(`/api/checkout/orders/${input.orderId}`, token())).status, 404);
  assert.equal((await request('/api/checkout/pix', token(), input)).status, 404);
});
test('approved payment delivers once, survives restart/reload, and hides payer data', async () => {
  const input = draft(); const key = token();
  await request('/api/checkout/pix', key, input);
  payments.get(input.orderId)!.status = 'approved';
  const responses = await Promise.all([1, 2, 3].map(() => request(`/api/checkout/orders/${input.orderId}`, key)));
  const successful = [];
  for (const response of responses) if (response.ok) successful.push(await response.json());
  assert.ok(successful.length > 0);
  const result = (await (await request(`/api/checkout/orders/${input.orderId}`, key)).json()).result;
  assert.ok(result.url.startsWith('https://love.example/p/ana-joao-'));
  assert.ok(result.qrCode.startsWith('data:image/png;base64,'));
  assert.equal(await prisma.page.count(), 1); assert.equal(createCalls, 1);
  const retried = await (await request('/api/checkout/pix', key, { ...input, nomeCasal: 'Changed' })).json();
  assert.equal(retried.result.url, result.url);
  const slug = result.url.split('/').at(-1);
  const publicPage = await (await fetch(`${base}/api/pages/${slug}`)).json();
  assert.equal(publicPage.nomeCasal, input.nomeCasal);
  assert.equal(publicPage.payerCpf, undefined); assert.equal(publicPage.orderId, undefined);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: input.orderId } })).payerCpf, '');
});
test('rejects wrong amount, currency, receiver, reference and payment method', async () => {
  const input = draft(); const key = token(); await request('/api/checkout/pix', key, input);
  const info = payments.get(input.orderId)!; info.status = 'approved';
  for (const change of [{ transaction_amount: 0.01 }, { currency_id: 'USD' }, { collector_id: 999 }, { external_reference: 'other-order' }, { payment_method_id: 'visa' }]) {
    const original = { ...info }; Object.assign(info, change);
    assert.equal((await request(`/api/checkout/orders/${input.orderId}`, key)).status, 502);
    assert.equal(await prisma.page.count(), 0); Object.assign(info, original);
  }
});
test('provider timeout recovers using the same order idempotency key', async () => {
  const input = draft(); const key = token(); failAfterCreate = true;
  assert.equal((await request('/api/checkout/pix', key, input)).status, 503);
  assert.equal(await prisma.order.count(), 1);
  assert.equal((await request(`/api/checkout/orders/${input.orderId}`, key)).status, 200);
  assert.equal(payments.size, 1); assert.equal(createCalls, 2);
});
test('paid order retries delivery after database failure without charging again', async () => {
  const input = draft(); const key = token(); await request('/api/checkout/pix', key, input);
  payments.get(input.orderId)!.status = 'approved';
  await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_page BEFORE INSERT ON Page BEGIN SELECT RAISE(ABORT, 'simulated failure'); END;`);
  try { assert.equal((await request(`/api/checkout/orders/${input.orderId}`, key)).status, 503); assert.equal(await prisma.page.count(), 0); }
  finally { await prisma.$executeRawUnsafe('DROP TRIGGER fail_page'); }
  const recovered = await (await request(`/api/checkout/orders/${input.orderId}`, key)).json();
  assert.ok(recovered.result); assert.equal(createCalls, 1);
});
test('cancelled payment never publishes a page', async () => {
  const input = draft(); const key = token(); await request('/api/checkout/pix', key, input);
  payments.get(input.orderId)!.status = 'cancelled';
  const data = await (await request(`/api/checkout/orders/${input.orderId}`, key)).json();
  assert.equal(data.status, 'cancelled'); assert.equal(data.result, null); assert.equal(await prisma.page.count(), 0);
});
test('buyer can cancel a pending PIX, edit, and create a fresh order', async () => {
  const first = draft(); const key = token();
  await request('/api/checkout/pix', key, first);
  const cancelled = await fetch(`${base}/api/checkout/orders/${first.orderId}/cancel`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}` },
  });
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).status, 'cancelled');
  assert.equal(payments.get(first.orderId)!.status, 'cancelled');
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: first.orderId } })).payerCpf, '');
  assert.equal(await prisma.page.count(), 0);

  const second = { ...draft(), nomeCasal: 'Ana & Maria' };
  const secondKey = token();
  const created = await request('/api/checkout/pix', secondKey, second);
  assert.equal(created.status, 200);
  assert.equal(payments.get(second.orderId)!.status, 'pending');
  assert.notEqual(second.orderId, first.orderId);
});
test('webhook requires valid signature and reconciles payment from provider', async () => {
  const input = draft(); const key = token(); await request('/api/checkout/pix', key, input);
  const info = payments.get(input.orderId)!; info.status = 'approved';
  const path = `/api/webhooks/mercadopago?data.id=${info.id}`;
  assert.equal((await request(path, key, { status: 'approved' })).status, 401);
  const ts = String(Date.now()); const requestId = randomUUID();
  const digest = createHmac('sha256', 'test-secret').update(`id:${info.id};request-id:${requestId};ts:${ts};`).digest('hex');
  const signature = `ts=${ts},v1=${digest}`;
  assert.ok(validSignature('test-secret', signature, requestId, String(info.id)));
  for (let i = 0; i < 2; i++) assert.equal((await fetch(base + path, { method: 'POST', headers: { 'x-signature': signature, 'x-request-id': requestId } })).status, 200);
  assert.equal(await prisma.page.count(), 1);
});
test('invalid payer, invalid date and oversized image fail before charging', async () => {
  for (const change of [{ cpf: '00000000000' }, { email: 'invalid' }, { dataInicio: '2024-02-31' }, { fotoUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }, { fotoUrl: `data:image/png;base64,${Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64')}` }]) {
    assert.equal((await request('/api/checkout/pix', token(), { ...draft(), ...change })).status, 400);
  }
  assert.equal(createCalls, 0);
});

test('definitive provider refusal ends the order and does not retry charges', async () => {
  const input = draft(); const key = token(); rejectCreation = true;
  const response = await (await request('/api/checkout/pix', key, input)).json();
  assert.equal(response.status, 'rejected'); assert.equal(response.result, null);
  await request(`/api/checkout/orders/${input.orderId}`, key);
  assert.equal(createCalls, 1); assert.equal(payments.size, 0);
});
