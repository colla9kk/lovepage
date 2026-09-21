'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { Heart, Sparkles, MessageCircle, Music, Play, ChevronLeft, ChevronRight } from 'lucide-react';

function ChuvaDeCoracoes() {
  // Deterministic positions keep server rendering and hydration identical.
  const coracoes = Array.from({ length: 25 }, (_, id) => ({
    id, left: (id * 37 % 92) + 4, delay: (id * 17 % 60) / 10,
    duration: 4 + (id * 13 % 50) / 10, size: 14 + (id * 7 % 16),
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
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
            transform: translateY(50vh) translateX(20px) rotate(180deg);
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(105vh) translateX(-20px) rotate(360deg);
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

export default function GiftPageClient({ slug }: { slug: string }) {

  const [pagina, setPagina] = useState<{ nomeCasal: string; dataInicio: string; mensagem: string; fotoUrl: string; fotoUrls?: string[]; spotifyTrackId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [musicaRevelada, setMusicaRevelada] = useState(false);
  const [fotoAtual, setFotoAtual] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/api/pages/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Não encontrada');
        return res.json();
      })
      .then((data) => {
        setPagina(data);
        setLoading(false);
      })
      .catch(() => {
        setErro(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!pagina?.dataInicio) return;
    const calcularTempo = () => {
      const inicio = new Date(pagina.dataInicio).getTime();
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
  }, [pagina]);

  const fotos = pagina?.fotoUrls?.length ? pagina.fotoUrls : pagina?.fotoUrl ? [pagina.fotoUrl] : [];

  useEffect(() => {
    if (fotos.length <= 1) return;
    const interval = setInterval(() => setFotoAtual(index => (index + 1) % fotos.length), 4500);
    return () => clearInterval(interval);
  }, [fotos.length]);

  const compartilharWhatsApp = () => {
    const texto = `💖 Fiz uma surpresa especial para você: ${pagina?.nomeCasal || 'LovePage'}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <p className="text-rose-400 font-medium animate-pulse text-lg flex items-center gap-2">
          <Sparkles className="animate-spin" size={20} /> Carregando surpresa romântica...
        </p>
      </div>
    );
  }

  if (erro || !pagina) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Heart className="text-slate-700 mb-4" size={56} />
        <h1 className="text-2xl font-bold text-rose-400 mb-2">Página não encontrada</h1>
        <p className="text-slate-400">Esta página especial não existe ou o link está incorreto.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-x-hidden">
      <ChuvaDeCoracoes />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-6 my-8 relative z-20">
        {pagina.spotifyTrackId && !musicaRevelada && (
          <button
            type="button"
            onClick={() => setMusicaRevelada(true)}
            className="w-full group bg-gradient-to-br from-rose-500/15 to-fuchsia-500/10 hover:from-rose-500/25 hover:to-fuchsia-500/20 border border-rose-500/30 rounded-2xl p-5 transition shadow-lg"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 group-hover:scale-110 transition">
              <Play size={24} className="fill-white ml-1" />
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-rose-300 font-semibold">
              <Music size={18} />
              Tem uma música para você
            </div>
            <p className="text-xs text-slate-400 mt-1">Toque para revelar a música de vocês 🎵</p>
          </button>
        )}

        {pagina.spotifyTrackId && musicaRevelada && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-sm text-rose-300 font-medium">
              <Music size={16} /> A música de vocês 💖
            </div>
            <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-700">
              <iframe
                src={`https://open.spotify.com/embed/track/${pagina.spotifyTrackId}?utm_source=generator&theme=0&autoplay=1`}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            </div>
            <p className="text-[11px] text-slate-500">Se o navegador não iniciar sozinho, toque no play do Spotify.</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative w-full max-w-sm aspect-[4/5] mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950">
            <img
              src={fotos[fotoAtual] || pagina.fotoUrl || 'https://via.placeholder.com/300'}
              alt={`Memória ${fotoAtual + 1} de ${pagina.nomeCasal}`}
              className="w-full h-full object-cover transition duration-500"
            />
            {fotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setFotoAtual(index => (index - 1 + fotos.length) % fotos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => setFotoAtual(index => (index + 1) % fotos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur"
                  aria-label="Próxima foto"
                >
                  <ChevronRight size={22} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur px-3 py-1 rounded-full text-xs text-white">
                  {fotoAtual + 1} / {fotos.length}
                </div>
              </>
            )}
          </div>
          {fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 justify-start">
              {fotos.map((foto, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFotoAtual(index)}
                  className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition ${index === fotoAtual ? 'border-rose-500 scale-105' : 'border-slate-700 opacity-70 hover:opacity-100'}`}
                  aria-label={`Ver foto ${index + 1}`}
                >
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-rose-400 flex items-center justify-center gap-2">
          <Sparkles className="text-amber-400" size={24} />
          {pagina.nomeCasal}
        </h1>

        <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-4 shadow-inner">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Juntos Há</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800"><span className="block text-2xl font-bold text-rose-400">{tempo.dias}</span><span className="text-xs text-slate-400">Dias</span></div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800"><span className="block text-2xl font-bold text-rose-400">{tempo.horas}</span><span className="text-xs text-slate-400">Horas</span></div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800"><span className="block text-2xl font-bold text-rose-400">{tempo.minutos}</span><span className="text-xs text-slate-400">Min</span></div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800"><span className="block text-2xl font-bold text-rose-400">{tempo.segundos}</span><span className="text-xs text-slate-400">Seg</span></div>
          </div>
        </div>

        <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-slate-300 text-base whitespace-pre-line text-left leading-relaxed shadow-sm">
          {pagina.mensagem}
        </div>

        <button
          type="button"
          onClick={compartilharWhatsApp}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
        >
          <MessageCircle size={20} />
          Compartilhar no WhatsApp
        </button>

        <p className="text-xs text-slate-500">Envie esta surpresa para quem você ama 💖</p>

        <div className="pt-2 flex justify-center text-rose-500">
          <Heart className="animate-pulse fill-rose-500" size={28} />
        </div>
      </div>
    </div>
  );
}