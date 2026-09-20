import { createHmac, timingSafeEqual } from 'node:crypto';
export function validSignature(secret: string, signature: string, requestId: string, dataId: string) {
  const parts = Object.fromEntries(signature.split(',').map(part => part.trim().split('=')));
  if (!parts.ts || !/^\d+$/.test(parts.ts) || !/^[a-f0-9]{64}$/i.test(parts.v1 || '') || !requestId || !dataId) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  return timingSafeEqual(expected, Buffer.from(parts.v1, 'hex'));
}
