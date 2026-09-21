'use client';

import React, { useState, useEffect } from 'react';
import { useCheckout } from '@/hooks/useCheckout';
import { API_URL } from '@/lib/api';
import { Heart, Image as ImageIcon, Calendar, Sparkles, Clock, Copy, Check, Download, Music, Upload, CreditCard, Lock, CheckCircle2, X, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

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
  const effectivePriceCents = payment.checkout?.amountCents ?? (promoAvailable && promoAmountCents ? promoAmountCents : basePriceCents);
  const priceLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectivePriceCents / 100);
  const [nomeCasalInput, setNomeCasal] = useState('Matheus & Marianne');
  const [dataInicioInput, setDataInicio] = useState('2024-01-01');
  const [mensagemInput, setMensagem] = useState('Cada segundo ao seu lado é um presente inesquecível. Te amo!');
  const [fotoUrlsInput, setFotoUrls] = useState<string[]>([DEFAULT_PHOTO]);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const [spotifyTrackIdInput, setSpotifyTrackId] = useState('4cOdK2wGLETKBW3PvgPWqT');

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
  const fotoPreview = fotoUrls[Math.min(previewPhotoIndex, fotoUrls.length - 1)] || fotoUrl;
  const spotifyTrackId = payment.checkout?.pageData?.spotifyTrackId ?? spotifyTrackIdInput;

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('promo')?.trim() || '';
    setPromoCode(code);
  }, []);

  useEffect(() => {
    if (!promoCode || !payment.ready) {
      setPromoAmountCents(null);
      setPromoAvailable(false);
      setPromoMessage('');
      return;
    }
    let stopped = false;
    const controller = new AbortController();
    setPromoChecking(true);
    const query = payment.session ? `?orderId=${encodeURIComponent(payment.session.orderId)}` : '';
    fetch(`${API_URL}/api/promos/${encodeURIComponent(promoCode)}${query}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async res => ({ res, data: await res.json().catch(() => ({})) }))
      .then(({ res, data }) => {
        if (stopped) return;
        if (!res.ok || !data.valid) {
          setPromoAmountCents(null);
          setPromoAvailable(false);
          setPromoMessage('Este link promocional não é válido.');
          return;
        }
        setPromoAmountCents(Number(data.amountCents));
        setPromoAvailable(Boolean(data.available));
        setPromoMessage(data.available ? 'Preço especial liberado para este link.' : 'Esta promoção de uso único já foi utilizada.');
      })
      .catch(() => {
        if (!stopped) {
          setPromoAmountCents(null);
          setPromoAvailable(false);
          setPromoMessage('Não foi possível validar o link promocional agora.');
        }
      })
      .finally(() => { if (!stopped) setPromoChecking(false); });
    return () => { stopped = true; controller.abort(); };
  }, [promoCode, payment.ready, payment.session?.orderId]);

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

    const currentCount = fotoUrlsInput.length === 1 && fotoUrlsInput[0] === DEFAULT_PHOTO ? 0 : fotoUrlsInput.length;
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
      setFotoUrls(previous => {
        const base = previous.length === 1 && previous[0] === DEFAULT_PHOTO ? [] : previous;
        return [...base, ...compressed].slice(0, 10);
      });
      setPreviewPhotoIndex(currentCount);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : 'Não foi possível preparar as fotos.');
    }
  };

  const removerFoto = (index: number) => {
    setFotoUrls(previous => {
      const next = previous.filter((_, photoIndex) => photoIndex !== index);
      return next.length ? next : [DEFAULT_PHOTO];
    });
    setPreviewPhotoIndex(0);
  };

  const iniciarCheckout = async () => {
    setModalPixOpen(true);
    if (!payment.session) await payment.start({
      nomeCasal,
      dataInicio,
      mensagem,
      fotoUrl,
      fotoUrls,
      spotifyTrackId,
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

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 max-w-7xl mx-auto w-full">
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Casal</label>
              <input type="text" value={nomeCasal} onChange={(e) => setNomeCasal(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Calendar size={16} /> Data do Início
              </label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Music size={16} /> ID da Música do Spotify (Opcional)
              </label>
              <input type="text" value={spotifyTrackId} onChange={(e) => setSpotifyTrackId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Ex: 4cOdK2wGLETKBW3PvgPWqT" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <ImageIcon size={16} /> Álbum do Casal
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
                  value={fotoUrl.startsWith('data:') ? '' : fotoUrl}
                  onChange={(e) => setFotoUrls(previous => {
                    const next = [...previous];
                    next[0] = e.target.value || DEFAULT_PHOTO;
                    return next;
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder={fotoUrl.startsWith('data:') ? 'Foto principal enviada pelo dispositivo' : 'https://...'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Carta / Mensagem Romântica</label>
              <textarea rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <div>
              <label htmlFor="payer-email" className="block text-sm font-medium text-slate-300 mb-1">Seu e-mail</label>
              <input id="payer-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3" />
            </div>
            <div>
              <label htmlFor="payer-cpf" className="block text-sm font-medium text-slate-300 mb-1">Seu CPF</label>
              <input id="payer-cpf" inputMode="numeric" maxLength={14} value={cpf} onChange={e => setCpf(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3" />
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

          <div className="w-full max-w-[360px] h-[680px] bg-slate-950 border-[8px] border-slate-800 rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col p-4 text-center text-white">
            <ChuvaDeCoracoes />

            <div className="relative z-20 flex flex-col h-full overflow-y-auto space-y-4 pr-1">
              {spotifyTrackId && (
                <div className="w-full rounded-xl overflow-hidden shrink-0 shadow-md">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
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

              <h2 className="text-2xl font-bold text-rose-400">{nomeCasal || 'Seus Nomes'}</h2>

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
                {mensagem || 'Sua mensagem aparecerá aqui...'}
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