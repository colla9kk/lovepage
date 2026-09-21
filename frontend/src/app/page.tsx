'use client';

import React, { useState, useEffect } from 'react';
import { useCheckout } from '@/hooks/useCheckout';
import { trackMetric } from '@/lib/metrics';
import { Heart, Image as ImageIcon, Calendar, Sparkles, Clock, Copy, Check, Download, Music, Upload, CreditCard, Lock, CheckCircle2, X, Loader2, ChevronLeft, ChevronRight, Trash2, MessageCircle, Palette } from 'lucide-react';

function ChuvaDeCoracoes() {
  // Deterministic positions keep server rendering and hydration identical.
  const coracoes = Array.from({ length: 25 }, (_, id) => ({
    id, left: (id * 37 % 92) + 4, delay: (id * 17 % 60) / 10,
    duration: 4 + (id * 13 % 50) / 10, size: 14 + (id * 7 % 16),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {coracoes.map((c) => (
        <span
          key={c.id}
          className="absolute -top-8 select-none animate-cairEBalancar"
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            fontSize: `${c.size}px`,
            filter: 'drop-shadow(0px 2px 4px rgba(225, 29, 72, 0.4))',
          }}
        >
          ❤️
        </span>
      ))}
      <style jsx>{`
        @keyframes cairEBalancar {
          0% {
            transform: translateY(-20px) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          50% {
            transform: translateY(340px) translateX(15px) rotate(180deg);
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(680px) translateX(-15px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-cairEBalancar {
          animation: cairEBalancar infinite linear;
        }
      `}</style>
    </div>
  );
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800';

function spotifyTrackIdFromInput(value: string) {
  const input = value.trim();
  if (!input) return '';
  if (/^[A-Za-z0-9]{22}$/.test(input)) return input;

  const uri = /^spotify:track:([A-Za-z0-9]{22})$/.exec(input);
  if (uri) return uri[1];

  try {
    const url = new URL(input);
    if (!['open.spotify.com', 'www.open.spotify.com'].includes(url.hostname.toLowerCase())) return '';
    return /^\/track\/([A-Za-z0-9]{22})\/?$/.exec(url.pathname)?.[1] || '';
  } catch {
    return '';
  }
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

async function compressPhoto(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onerror = () => reject(new Error('Não foi possível abrir a foto.'));
    img.onload = () => resolve(img);
    img.src = source;
  });

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível preparar a foto.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.84;
  let result = canvas.toDataURL('image/webp', quality);
  const bytes = (value: string) => Math.ceil((value.length - value.indexOf(',') - 1) * 0.75);
  while (bytes(result) > 700 * 1024 && quality > 0.5) {
    quality -= 0.08;
    result = canvas.toDataURL('image/webp', quality);
  }
  return result;
}

export default function Home() {
  const payment = useCheckout();
  const basePriceCents = Number(process.env.NEXT_PUBLIC_PRICE_CENTS || 1990);
  const [promoCode, setPromoCode] = useState('');
  const [promoAmountCents, setPromoAmountCents] = useState<number | null>(null);
  const [promoAvailable, setPromoAvailable] = useState(false);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const friendPromoHash = '18ff73a2155e1812d12502006edb91b563db904bda1f3f06a92e3c25423387f4';
  const effectivePriceCents = payment.checkout?.amountCents ?? (promoAvailable && promoAmountCents ? promoAmountCents : basePriceCents);
  const priceLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectivePriceCents / 100);
  const [nomeCasalInput, setNomeCasal] = useState('');
  const [dataInicioInput, setDataInicio] = useState('');
  const [mensagemInput, setMensagem] = useState('');
  const [fotoUrlsInput, setFotoUrls] = useState<string[]>([]);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const [spotifyTrackIdInput, setSpotifyTrackId] = useState('');
  const [themeInput, setThemeInput] = useState<'romantic' | 'friend' | 'family'>('romantic');
  const [relationLabelInput, setRelationLabel] = useState('');
  const [highlightsInput, setHighlights] = useState<string[]>(['', '', '']);
  const [formError, setFormError] = useState('');

  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [modalPixOpen, setModalPixOpen] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const loading = payment.loading || !payment.ready || promoChecking;
  const resultado = payment.checkout?.result || null;
  const pagamentoAprovado = !!resultado;
  const pixQrCodeBase64 = payment.checkout?.qrCodeBase64;
  const pixCopiaECola = payment.checkout?.qrCodeCopiaCola || '';
  const nomeCasal = payment.checkout?.pageData?.nomeCasal ?? nomeCasalInput;
  const dataInicio = payment.checkout?.pageData?.dataInicio ?? dataInicioInput;
  const mensagem = payment.checkout?.pageData?.mensagem ?? mensagemInput;
  const checkoutPhotos = payment.checkout?.pageData?.fotoUrls;
  const fotoUrls = checkoutPhotos?.length
    ? checkoutPhotos
    : payment.checkout?.pageData?.fotoUrl
      ? [payment.checkout.pageData.fotoUrl]
      : fotoUrlsInput;
  const fotoUrl = fotoUrls[0] || DEFAULT_PHOTO;
  const fotoPreview = fotoUrls[Math.min(previewPhotoIndex, Math.max(0, fotoUrls.length - 1))] || fotoUrl;
  const spotifyTrackId = payment.checkout?.pageData?.spotifyTrackId ?? spotifyTrackIdInput;
  const spotifyEmbedTrackId = spotifyTrackIdFromInput(spotifyTrackId);
  const theme = payment.checkout?.pageData?.theme ?? themeInput;
  const template = theme === 'friend' || theme === 'family' ? theme : 'romantic';
  const relationLabel = payment.checkout?.pageData?.relationLabel ?? relationLabelInput;
  const checkoutHighlights = payment.checkout?.pageData?.highlights;
  const highlights = checkoutHighlights?.length ? checkoutHighlights : highlightsInput.filter(item => item.trim());
  const templateCopy = {
    romantic: {
      label: 'Romântico',
      nameLabel: 'Nome do casal',
      dateLabel: 'Data do início',
      albumLabel: 'Álbum do casal',
      messageLabel: 'Carta / mensagem romântica',
      namePlaceholder: 'Ex: Matheus & Marianne',
      previewName: 'Seu Amor & Você',
      shell: 'bg-slate-950 border-slate-800',
      accent: 'text-rose-400',
    },
    friend: {
      label: 'Melhor amigo(a)',
      nameLabel: 'Nome do seu amigo(a)',
      dateLabel: 'Desde quando vocês se conhecem? (opcional)',
      albumLabel: 'Fotos das melhores memórias',
      messageLabel: 'Mensagem para seu amigo(a)',
      namePlaceholder: 'Ex: Wendel',
      previewName: 'Seu melhor amigo',
      shell: 'bg-[#071827] border-cyan-900/60',
      accent: 'text-cyan-300',
    },
    family: {
      label: 'Família',
      nameLabel: 'Nome da pessoa',
      dateLabel: 'Uma data especial (opcional)',
      albumLabel: 'Fotos em família',
      messageLabel: 'Mensagem de carinho e gratidão',
      namePlaceholder: 'Ex: Mãe',
      previewName: 'Alguém muito especial',
      shell: 'bg-[#171108] border-amber-900/60',
      accent: 'text-amber-200',
    },
  }[template];
  const previewNomeCasal = nomeCasal || templateCopy.previewName;
  const previewMensagem = mensagem || 'Sua mensagem especial vai aparecer aqui...';

  useEffect(() => {
    const key = 'lovepage.metric.landing_view';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      trackMetric('landing_view');
    }
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('promo')?.trim() || '';
    setPromoCode(code);
  }, []);

  useEffect(() => {
    if (!promoCode || !payment.ready) {
      setPromoAmountCents(null);
      setPromoAvailable(false);
      setPromoMessage('');
      setPromoChecking(false);
      return;
    }
    let stopped = false;
    setPromoChecking(true);
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(promoCode))
      .then(buffer => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join(''))
      .then(hash => {
        if (stopped) return;
        const valid = hash === friendPromoHash;
        setPromoAmountCents(valid ? 1000 : null);
        setPromoAvailable(valid);
        setPromoMessage(valid ? 'Preço especial liberado para este link.' : 'Este link promocional não é válido.');
      })
      .catch(() => {
        if (!stopped) {
          setPromoAmountCents(null);
          setPromoAvailable(false);
          setPromoMessage('Não foi possível validar o link promocional agora.');
        }
      })
      .finally(() => { if (!stopped) setPromoChecking(false); });
    return () => { stopped = true; };
  }, [promoCode, payment.ready]);

  useEffect(() => {
    const calcularTempo = () => {
      if (!dataInicio) return;
      const inicio = new Date(dataInicio).getTime();
      const agora = new Date().getTime();
      const diferenca = Math.max(0, agora - inicio);
      setTempo({
        dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
      });
    };
    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);
    return () => clearInterval(interval);
  }, [dataInicio]);

  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const currentCount = fotoUrlsInput.length;
    if (currentCount + files.length > 10) {
      alert(`Você pode usar até 10 fotos. Ainda cabem ${Math.max(0, 10 - currentCount)}.`);
      return;
    }
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      alert('Use apenas imagens JPEG, PNG ou WebP.');
      return;
    }
    if (files.some(file => file.size > 12 * 1024 * 1024)) {
      alert('Cada arquivo original deve ter no máximo 12 MB.');
      return;
    }

    try {
      const compressed = await Promise.all(files.map(compressPhoto));
      setFotoUrls(previous => [...previous, ...compressed].slice(0, 10));
      setPreviewPhotoIndex(currentCount);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : 'Não foi possível preparar as fotos.');
    }
  };

  const removerFoto = (index: number) => {
    setFotoUrls(previous => {
      return previous.filter((_, photoIndex) => photoIndex !== index);
    });
    setPreviewPhotoIndex(0);
  };

  const iniciarCheckout = async () => {
    if (!payment.session) {
      const cpfDigits = cpf.replace(/\D/g, '');
      if (!nomeCasal.trim()) { setFormError(`Preencha: ${templateCopy.nameLabel.toLowerCase()}.`); return; }
      if (template === 'romantic' && !dataInicio) { setFormError('Escolha a data de início do casal.'); return; }
      if (!mensagem.trim()) { setFormError('Escreva uma mensagem para a pessoa.'); return; }
      if (!fotoUrlsInput.length) { setFormError('Adicione pelo menos uma foto.'); return; }
      if (spotifyTrackIdInput.trim() && !spotifyTrackIdFromInput(spotifyTrackIdInput)) {
        setFormError('Cole um link válido de uma música do Spotify.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setFormError('Coloque um e-mail válido.'); return; }
      if (cpfDigits.length !== 11) { setFormError('Confira o CPF antes de gerar o PIX.'); return; }
      setFormError('');
      trackMetric('checkout_click');
    }

    setModalPixOpen(true);
    if (!payment.session) await payment.start({
      nomeCasal,
      dataInicio,
      mensagem,
      fotoUrl,
      fotoUrls,
      spotifyTrackId,
      theme: template,
      relationLabel,
      highlights: highlightsInput.map(item => item.trim()).filter(Boolean),
      email,
      cpf,
      ...(promoAvailable && promoCode ? { promoCode } : {}),
    });
  };

  const copiarPix = async () => {
    if (pixCopiaECola) {
      try { await navigator.clipboard.writeText(pixCopiaECola); } catch { alert('Não foi possível copiar. Selecione o código manualmente.'); return; }
      setPixCopiado(true);
      setTimeout(() => setPixCopiado(false), 2500);
    }
  };

  const compartilharResultado = () => {
    if (!resultado) return;
    trackMetric('whatsapp_share', { orderId: payment.session?.orderId });
    const texto = `💖 Fiz uma surpresa especial para você: ${previewNomeCasal}\n${resultado.url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  const copiarLink = async () => {
    if (resultado) {
      try { await navigator.clipboard.writeText(resultado.url); } catch { alert('Não foi possível copiar. Selecione o link manualmente.'); return; }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const corrigirPedido = async () => {
    if (!payment.session) return;
    const confirmed = window.confirm('Cancelar este PIX e voltar para editar? O QR Code atual deixará de valer e você poderá gerar um novo pedido.');
    if (!confirmed) return;

    // Preserve the public gift fields even if this session was restored after a reload.
    setNomeCasal(nomeCasal);
    setDataInicio(dataInicio);
    setMensagem(mensagem);
    setFotoUrls(fotoUrls);
    setPreviewPhotoIndex(0);
    setSpotifyTrackId(spotifyTrackId);
    setThemeInput(template);
    setRelationLabel(relationLabel);
    setHighlights([
      highlights[0] || '',
      highlights[1] || '',
      highlights[2] || '',
    ]);

    const cancelled = await payment.cancelPending();
    if (cancelled) {
      setModalPixOpen(false);
      alert('PIX anterior cancelado. Corrija os dados e gere um novo pedido.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur p-4 flex justify-between items-center px-6">
        <div className="flex items-center gap-2 text-rose-500 font-bold text-xl">
          <Heart className="fill-rose-500" size={24} />
          <span>LovePage</span>
        </div>
        <button
          onClick={iniciarCheckout}
          disabled={loading}
          className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-6 py-2.5 rounded-full transition shadow-lg shadow-rose-950 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
          {loading ? 'Carregando...' : payment.session ? 'Ver meu pedido' : `Finalizar & Gerar Presente (${priceLabel})`}
        </button>
      </header>

      <section className="w-full border-b border-slate-800/70 bg-gradient-to-b from-rose-950/20 to-slate-950 px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
            <Heart size={13} className="fill-rose-400" /> presente digital pronto em poucos minutos
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight text-white">
            Transforme a história de vocês em uma página só do casal.
          </h1>
          <p className="max-w-2xl mx-auto mt-4 text-slate-300 md:text-lg">
            Fotos, música do Spotify, contador do relacionamento e uma carta especial em um link para enviar no WhatsApp.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#criar" className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-rose-950 transition">
              Criar minha LovePage por {priceLabel}
            </a>
            <span className="text-xs text-slate-500">Pagamento único via PIX • até 10 fotos</span>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl mx-auto">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><b className="block text-white">1.</b><span className="text-xs text-slate-400">Personalize</span></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><b className="block text-white">2.</b><span className="text-xs text-slate-400">Pague no PIX</span></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><b className="block text-white">3.</b><span className="text-xs text-slate-400">Envie o link</span></div>
          </div>
        </div>
      </section>

      <main id="criar" className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 max-w-7xl mx-auto w-full">
        {/* Lado Esquerdo: Formulário */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 h-fit">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-amber-400" size={22} /> Personalize seu Presente
            </h1>
            <p className="text-slate-400 text-sm mt-1">Preencha os campos e veja a prévia e o QR Code ao lado.</p>
          </div>

          {promoCode && (
            <div className={`rounded-xl border p-3 text-sm ${promoAvailable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
              {promoChecking ? 'Validando seu preço especial...' : promoMessage}
              {promoAvailable && promoAmountCents && (
                <span className="font-bold"> Valor deste link: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(promoAmountCents / 100)}.</span>
              )}
            </div>
          )}

          <fieldset disabled={!!payment.session || loading} className="space-y-4 disabled:opacity-70">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{templateCopy.nameLabel}</label>
              <input
                type="text"
                value={nomeCasal}
                onChange={(e) => setNomeCasal(e.target.value)}
                placeholder={templateCopy.namePlaceholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Calendar size={16} /> {templateCopy.dateLabel}
              </label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Palette size={16} /> Para quem é o presente?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([
                  ['romantic', '❤️ Romântico', 'Casal, contador e carta de amor'],
                  ['friend', '🤝 Amizade', 'Memórias, resenhas e parceria'],
                  ['family', '🏡 Família', 'Homenagem, carinho e gratidão'],
                ] as const).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setThemeInput(value)}
                    className={`rounded-xl border p-3 text-left transition ${template === value ? 'border-rose-500 bg-rose-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-600'}`}
                  >
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-[10px] text-slate-500 mt-1">{hint}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Cada modelo muda a estrutura e os textos da página, não só as cores.</p>
            </div>

            {template !== 'romantic' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {template === 'friend' ? 'Apelido / como você chama essa pessoa (opcional)' : 'Parentesco (opcional)'}
                </label>
                <input
                  type="text"
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder={template === 'friend' ? 'Ex: meu parceiro de crime' : 'Ex: mãe, pai, irmã, avó...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            {template !== 'romantic' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  {template === 'friend' ? '3 memórias / motivos que definem essa amizade' : '3 lembranças / motivos de gratidão'}
                </label>
                {highlightsInput.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => setHighlights(previous => previous.map((value, itemIndex) => itemIndex === index ? e.target.value : value))}
                    placeholder={template === 'friend' ? `Memória ${index + 1} (opcional)` : `Lembrança ${index + 1} (opcional)`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Music size={16} /> Link da Música no Spotify (Opcional)
              </label>
              <input
                type="url"
                value={spotifyTrackId}
                onChange={(e) => setSpotifyTrackId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="https://open.spotify.com/track/..."
              />
              <p className="text-[11px] text-slate-500 mt-2">
                No Spotify: Compartilhar → Copiar link da música. Cole o link inteiro aqui.
              </p>
              {spotifyTrackId && !spotifyEmbedTrackId && (
                <p className="text-[11px] text-amber-300 mt-1">Cole o link de uma música do Spotify.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <ImageIcon size={16} /> {templateCopy.albumLabel}
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUploadFotos}
                    className="hidden"
                    id="foto-upload"
                  />
                  <label
                    htmlFor="foto-upload"
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs px-4 py-2.5 rounded-lg cursor-pointer flex items-center gap-2 transition font-medium"
                  >
                    <Upload size={14} /> Adicionar fotos
                  </label>
                  <span className="text-xs text-slate-400">{fotoUrls.length}/10 fotos</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {fotoUrls.map((src, index) => (
                    <div key={`${src.slice(0, 24)}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                      <img src={src} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removerFoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/85 text-rose-300 flex items-center justify-center hover:bg-rose-600 hover:text-white transition"
                        aria-label={`Remover foto ${index + 1}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500">Você pode selecionar várias fotos de uma vez. Elas são otimizadas automaticamente antes do envio.</p>
                <p className="text-[11px] text-slate-500">Ou use uma URL HTTPS como primeira foto:</p>
                <input
                  type="text"
                  value={fotoUrlsInput[0]?.startsWith('data:') ? '' : (fotoUrlsInput[0] || '')}
                  onChange={(e) => setFotoUrls(previous => {
                    const value = e.target.value.trim();
                    if (!value) return previous.slice(1);
                    const next = [...previous];
                    next[0] = value;
                    return next;
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder={fotoUrl.startsWith('data:') ? 'Foto principal enviada pelo dispositivo' : 'https://...'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{templateCopy.messageLabel}</label>
              <textarea rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <div>
              <label htmlFor="payer-email" className="block text-sm font-medium text-slate-300 mb-1">Seu e-mail</label>
              <input id="payer-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3" />
            </div>
            <div>
              <label htmlFor="payer-cpf" className="block text-sm font-medium text-slate-300 mb-1">Seu CPF</label>
              <input id="payer-cpf" inputMode="numeric" maxLength={14} value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3" />
              <p className="text-xs text-slate-400 mt-2">Dados do comprador para processar o PIX. Não aparecem na página pública.</p>
            </div>
          </fieldset>
          {payment.session && <p className="text-sm text-slate-300">Seu pedido está salvo. Use este navegador para acompanhar a compra. A página usará os dados enviados ao gerar o PIX.</p>}
          {payment.session && !resultado && !payment.terminal && (
            <button
              type="button"
              onClick={corrigirPedido}
              disabled={loading}
              className="w-full border border-slate-700 hover:border-rose-500 text-slate-200 hover:text-white py-2.5 rounded-xl transition disabled:opacity-50"
            >
              Corrigir dados / gerar novo PIX
            </button>
          )}
          {formError && <p role="alert" className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">{formError}</p>}
          {payment.error && <p role="alert" className="text-sm text-amber-300">{payment.error}</p>}
          {(resultado || payment.terminal) && <button onClick={payment.reset} className="text-rose-300 underline">Criar outro presente</button>}
            <button
              onClick={iniciarCheckout}
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-rose-950 flex items-center justify-center gap-2 text-base mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              {loading ? 'Carregando...' : payment.session ? 'Ver meu pedido' : `Liberar QR Code & Link Exclusivo (${priceLabel})`}
            </button>
        </section>

        {/* Lado Direito: QR Code Libertado + Prévia */}
        <section className="flex flex-col items-center justify-start space-y-6">
          {resultado && (
            <div className="w-full max-w-[360px] bg-slate-900 border-2 border-emerald-500/60 p-5 rounded-2xl space-y-4 text-center shadow-2xl animate-fade-in">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
                <CheckCircle2 size={14} /> Pagamento Confirmado
              </div>

              <h3 className="font-bold text-rose-400 text-lg flex items-center justify-center gap-2">
                <Sparkles size={18} /> Seu QR Code está pronto!
              </h3>
              
              <div className="bg-white p-3 inline-block rounded-xl shadow-lg border-2 border-rose-500/20">
                <img src={resultado.qrCode} alt="QR Code" className="w-36 h-36 mx-auto rounded" />
                <p className="text-slate-700 text-[10px] font-bold mt-1 tracking-wide uppercase">Escaneie para abrir</p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={resultado.qrCode}
                  download={`qrcode-${nomeCasal.toLowerCase().replace(/\s+/g, '-')}.png`}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow"
                >
                  <Download size={14} /> Baixar QR Code (PNG)
                </a>

                <button
                  onClick={compartilharResultado}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle size={15} /> Enviar no WhatsApp
                </button>

                <button
                  onClick={copiarLink}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition border border-slate-700"
                >
                  {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiado ? 'Link Copiado!' : 'Copiar Link'}
                </button>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-400 select-all font-mono truncate">
                {resultado.url}
              </div>
            </div>
          )}

          <div className="text-slate-400 text-sm flex items-center gap-2">
            <Clock size={16} /> Prévia da página em tempo real:
          </div>

          <div className={`w-full max-w-[360px] h-[680px] border-[8px] rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col p-4 text-center text-white ${themePreview.shell}`}>
            <div className="absolute top-2 right-5 z-30 text-[9px] uppercase tracking-widest bg-black/40 border border-white/10 px-2 py-1 rounded-full text-slate-300">{themePreview.label}</div>
            <ChuvaDeCoracoes />

            <div className="relative z-20 flex flex-col h-full overflow-y-auto space-y-4 pr-1">
              {spotifyEmbedTrackId && (
                <div className="w-full rounded-xl overflow-hidden shrink-0 shadow-md">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${spotifyEmbedTrackId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  ></iframe>
                </div>
              )}

              <div className="space-y-2 shrink-0">
                <div className="relative w-52 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-900">
                  <img src={fotoPreview || 'https://via.placeholder.com/300'} alt={`Foto ${previewPhotoIndex + 1} do casal`} className="w-full h-full object-cover" />
                  {fotoUrls.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoIndex(index => (index - 1 + fotoUrls.length) % fotoUrls.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 flex items-center justify-center text-white"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoIndex(index => (index + 1) % fotoUrls.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 flex items-center justify-center text-white"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>
                {fotoUrls.length > 1 && (
                  <div className="flex justify-center gap-1.5">
                    {fotoUrls.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPreviewPhotoIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${index === previewPhotoIndex ? 'w-5 bg-rose-500' : 'w-1.5 bg-slate-600'}`}
                        aria-label={`Ver foto ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <h2 className={`text-2xl font-bold ${themePreview.accent}`}>{previewNomeCasal}</h2>

              <div className="bg-slate-900/90 border border-rose-500/20 rounded-xl p-3 shadow-inner">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Juntos Há</p>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.dias}</span><span className="text-[9px] text-slate-400">Dias</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.horas}</span><span className="text-[9px] text-slate-400">Horas</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.minutos}</span><span className="text-[9px] text-slate-400">Min</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.segundos}</span><span className="text-[9px] text-slate-400">Seg</span></div>
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-slate-300 text-xs whitespace-pre-line text-left leading-relaxed">
                {previewMensagem}
              </div>

              <div className="pt-2 pb-4 flex justify-center text-rose-500/80 shrink-0">
                <Heart className="animate-pulse fill-rose-500" size={22} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL DE PAGAMENTO PIX MERCADO PAGO */}
      {modalPixOpen && (
        <div role="dialog" aria-modal="true" aria-label="Pagamento do pedido" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-3xl p-6 text-center shadow-2xl relative space-y-5 animate-scale-up">
            
            <button
              aria-label="Fechar pagamento"
              onClick={() => setModalPixOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>

            {payment.error && <p role="alert" className="text-amber-300 text-sm">{payment.error}</p>}
            {payment.terminal ? (
              <div className="py-8 space-y-3"><h3 className="text-xl">Pagamento encerrado</h3><p>O pagamento foi recusado, cancelado ou devolvido. Feche esta janela, escolha criar outro presente e confira os dados do comprador antes de tentar novamente.</p></div>
            ) : pagamentoAprovado ? (
              <div className="py-8 space-y-3">
                <CheckCircle2 className="text-emerald-400 mx-auto animate-bounce" size={56} />
                <h3 className="text-2xl font-bold text-white">Pagamento Confirmado!</h3>
                <p className="text-slate-400 text-sm">Seu presente foi salvo. Feche esta janela para copiar o link e baixar o QR Code.</p>
              </div>
            ) : (
              <>
                <div>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-3 py-1 rounded-full font-semibold">
                    Pagamento Único via PIX
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-3">Libere seu Presente</h3>
                  <p className="text-slate-400 text-xs mt-1">Escaneie o PIX real do Mercado Pago no seu app do banco.</p>
                  <div className="text-3xl font-extrabold text-rose-400 mt-2">{priceLabel}</div>
                </div>

                {/* QR Code Real Gerado pelo Mercado Pago */}
                <div className="bg-white p-4 inline-block rounded-2xl shadow-inner border">
                  {pixQrCodeBase64 ? (
                    <img
                      src={pixQrCodeBase64}
                      alt="QR Code PIX Mercado Pago"
                      className="w-44 h-44 mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-500 text-xs">
                      Gerando QR Code...
                    </div>
                  )}
                  <p className="text-slate-800 text-[10px] font-bold mt-2">Abra o app do seu banco e escaneie</p>
                </div>

                {/* Chave Copia e Cola Real */}
                <div className="space-y-2">
                  <button
                    onClick={copiarPix}
                    className="w-full bg-slate-950 border border-slate-700 hover:border-rose-500 p-2.5 rounded-xl text-xs text-slate-300 font-mono flex items-center justify-between transition group cursor-pointer"
                  >
                    <span className="truncate pr-2">{pixCopiaECola || 'Carregando chave PIX...'}</span>
                    <span className="bg-rose-600 group-hover:bg-rose-500 text-white px-3 py-1 rounded text-[11px] font-sans font-medium shrink-0 flex items-center gap-1">
                      {pixCopiado ? <Check size={12} /> : <Copy size={12} />}
                      {pixCopiado ? 'Copiado!' : 'Copiar'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
                  <Loader2 className="animate-spin text-rose-500" size={14} />
                  <span>{payment.checkout?.status === 'approved' ? 'Pagamento recebido. Preparando seu presente...' : payment.session ? 'Acompanhando seu pedido automaticamente...' : 'Confira os dados do formulário para continuar.'}</span>
                </div>

                {payment.session && (
                  <button
                    type="button"
                    onClick={corrigirPedido}
                    disabled={loading}
                    className="w-full border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                  >
                    Corrigir dados / gerar novo PIX
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}