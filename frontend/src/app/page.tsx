'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Image as ImageIcon, Calendar, Sparkles, Clock, QrCode, Copy, Check, Download, Music, Upload, CreditCard, Lock, CheckCircle2, X, Loader2 } from 'lucide-react';

function ChuvaDeCoracoes() {
  const [coracoes, setCoracoes] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const novosCoracoes = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 92 + 4,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 5,
      size: 14 + Math.random() * 16,
    }));
    setCoracoes(novosCoracoes);
  }, []);

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

export default function Home() {
  const [nomeCasal, setNomeCasal] = useState('Matheus & Marianne');
  const [dataInicio, setDataInicio] = useState('2024-01-01');
  const [mensagem, setMensagem] = useState('Cada segundo ao seu lado é um presente inesquecível. Te amo!');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800');
  const [spotifyTrackId, setSpotifyTrackId] = useState('4cOdK2wGLETKBW3PvgPWqT');

  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ url: string; qrCode: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Estados do Mercado Pago PIX Real
  const [modalPixOpen, setModalPixOpen] = useState(false);
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState<string | null>(null);
  const [pixCopiaECola, setPixCopiaECola] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | number | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);

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

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('A fotografia deve ter um tamanho inferior a 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gerar cobrança PIX real no Mercado Pago ao clicar no botão
  const iniciarCheckout = async () => {
    if (!nomeCasal.trim()) {
      alert('Por favor, introduza o nome do casal.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCasal }),
      });
      const data = await res.json();

      if (data.success) {
        setPixQrCodeBase64(data.qrCodeBase64);
        setPixCopiaECola(data.qrCodeCopiaCola);
        setPaymentId(data.paymentId);
        setPagamentoAprovado(false);
        setModalPixOpen(true);
      } else {
        alert('Erro ao gerar PIX do Mercado Pago.');
      }
    } catch (e) {
      alert('Certifique-se de que o backend está a rodar na porta 5000!');
    }
    setLoading(false);
  };

  // Checar se o pagamento foi aprovado a cada 3 segundos
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (modalPixOpen && paymentId && !pagamentoAprovado) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/checkout/status/${paymentId}`);
          const data = await res.json();

          if (data.isApproved) {
            setPagamentoAprovado(true);
            clearInterval(interval);

            // Gerar a página do casal assim que o pagamento for aprovado
            const pageRes = await fetch('http://localhost:5000/api/pages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nomeCasal, dataInicio, mensagem, fotoUrl, spotifyTrackId }),
            });
            const pageData = await pageRes.json();
            if (pageData.success) {
              setResultado({ url: pageData.url, qrCode: pageData.qrCode });
              setTimeout(() => setModalPixOpen(false), 1500);
            }
          }
        } catch (e) {
          console.error('Verificando pagamento...', e);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [modalPixOpen, paymentId, pagamentoAprovado, nomeCasal, dataInicio, mensagem, fotoUrl, spotifyTrackId]);

  const copiarPix = () => {
    if (pixCopiaECola) {
      navigator.clipboard.writeText(pixCopiaECola);
      setPixCopiado(true);
      setTimeout(() => setPixCopiado(false), 2500);
    }
  };

  const copiarLink = () => {
    if (resultado) {
      navigator.clipboard.writeText(resultado.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
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
          {loading ? 'Gerando PIX...' : 'Finalizar & Gerar Presente (R$ 19,90)'}
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

          <div className="space-y-4">
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
                <ImageIcon size={16} /> Foto do Casal
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFoto}
                    className="hidden"
                    id="foto-upload"
                  />
                  <label
                    htmlFor="foto-upload"
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs px-4 py-2.5 rounded-lg cursor-pointer flex items-center gap-2 transition font-medium"
                  >
                    <Upload size={14} /> Selecionar Fotografia do Telemóvel/PC
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">Ou cole a URL direta de uma imagem da internet:</p>
                <input
                  type="text"
                  value={fotoUrl.startsWith('data:') ? '[Fotografia enviada do ficheiro local]' : fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Carta / Mensagem Romântica</label>
              <textarea rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <button
              onClick={iniciarCheckout}
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-rose-950 flex items-center justify-center gap-2 text-base mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              {loading ? 'Gerando PIX...' : 'Liberar QR Code & Link Exclusivo (R$ 19,90)'}
            </button>
          </div>
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

              <div className="relative w-52 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl shrink-0">
                <img src={fotoUrl || 'https://via.placeholder.com/300'} alt="Casal" className="w-full h-full object-cover" />
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-3xl p-6 text-center shadow-2xl relative space-y-5 animate-scale-up">
            
            <button
              onClick={() => setModalPixOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>

            {pagamentoAprovado ? (
              <div className="py-8 space-y-3">
                <CheckCircle2 className="text-emerald-400 mx-auto animate-bounce" size={56} />
                <h3 className="text-2xl font-bold text-white">Pagamento Confirmado!</h3>
                <p className="text-slate-400 text-sm">Seu QR Code e link exclusivo foram liberados.</p>
              </div>
            ) : (
              <>
                <div>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-3 py-1 rounded-full font-semibold">
                    Pagamento Único via PIX
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-3">Libere seu Presente</h3>
                  <p className="text-slate-400 text-xs mt-1">Escaneie o PIX real do Mercado Pago no seu app do banco.</p>
                  <div className="text-3xl font-extrabold text-rose-400 mt-2">R$ 19,90</div>
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
                  <span>Aguardando pagamento em tempo real...</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}