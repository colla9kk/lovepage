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

function spotifyTrackId(value: string) {
  const input = value.trim();
  if (!input) return '';
  if (/^[A-Za-z0-9]{22}$/.test(input)) return input;

  const uri = /^spotify:track:([A-Za-z0-9]{22})$/.exec(input);
  if (uri) return uri[1];

  try {
    const url = new URL(input);
    if (!['open.spotify.com', 'www.open.spotify.com'].includes(url.hostname.toLowerCase())) return null;
    const match = /^\/track\/([A-Za-z0-9]{22})\/?$/.exec(url.pathname);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

const photo = z.string().max(7 * 1024 * 1024).refine(value => {
  if (value.startsWith('data:')) {
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    return !!match && Buffer.from(match[2], 'base64').length <= 5 * 1024 * 1024;
  }
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}, 'Envie uma imagem JPEG, PNG ou WebP de até 5 MB, ou uma URL HTTPS.');

const specialDate = z.string().trim().max(10).refine(value => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getTime() <= Date.now();
}, 'Informe uma data válida, não futura.');

const templateValues = ['romantic', 'friend', 'family', 'midnight', 'minimal'] as const;

const pageInputBase = z.object({
  nomeCasal: z.string().trim().min(1).max(120),
  dataInicio: specialDate.optional().default(''),
  mensagem: z.string().trim().min(1).max(10000),
  fotoUrl: photo,
  fotoUrls: z.array(photo).min(1).max(10, 'Envie no máximo 10 fotos.').optional(),
  spotifyTrackId: z.string().trim().max(2048).optional().default('')
    .refine(value => spotifyTrackId(value) !== null, 'Cole um link válido de uma música do Spotify.')
    .transform(value => spotifyTrackId(value) || ''),
  theme: z.enum(templateValues).optional().default('romantic'),
  relationLabel: z.string().trim().max(80).optional().default(''),
  highlights: z.array(z.string().trim().min(1).max(280)).max(3).optional().default([]),
});

function validateTemplate(
  value: z.infer<typeof pageInputBase>,
  ctx: z.RefinementCtx,
) {
  const romanticLike = ['romantic', 'midnight', 'minimal'].includes(value.theme);
  if (romanticLike && !value.dataInicio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dataInicio'],
      message: 'Escolha a data de início do casal.',
    });
  }
}

export const pageInput = pageInputBase.superRefine(validateTemplate);

export const checkoutInput = pageInputBase.extend({
  orderId: z.string().uuid(),
  promoCode: z.string().trim().regex(/^[A-Za-z0-9_-]{16,128}$/).optional(),
  email: z.string().trim().email().max(254),
  cpf: z.string().transform(value => value.replace(/[.\-\s]/g, '')).refine(validCpf, 'CPF inválido.'),
}).superRefine(validateTemplate);

export type CheckoutInput = z.infer<typeof checkoutInput>;
