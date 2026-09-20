import { z } from 'zod';

export function validCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  for (let length = 9; length <= 10; length++) {
    const sum = [...value.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const digit = (sum * 10) % 11 % 10;
    if (digit !== Number(value[length])) return false;
  }
  return true;
}

const photo = z.string().max(7 * 1024 * 1024).refine(value => {
  if (value.startsWith('data:')) {
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    return !!match && Buffer.from(match[2], 'base64').length <= 5 * 1024 * 1024;
  }
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}, 'Envie uma imagem JPEG, PNG ou WebP de até 5 MB, ou uma URL HTTPS.');

export const pageInput = z.object({
  nomeCasal: z.string().trim().min(1).max(120),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getTime() <= Date.now();
  }, 'Informe uma data válida, não futura.'),
  mensagem: z.string().trim().min(1).max(10000),
  fotoUrl: photo,
  spotifyTrackId: z.string().trim().regex(/^$|^[a-zA-Z0-9]{22}$/).optional().default(''),
});
export const checkoutInput = pageInput.extend({
  orderId: z.string().uuid(),
  email: z.string().trim().email().max(254),
  cpf: z.string().transform(value => value.replace(/[.\-\s]/g, '')).refine(validCpf, 'CPF inválido.'),
});
export type CheckoutInput = z.infer<typeof checkoutInput>;
