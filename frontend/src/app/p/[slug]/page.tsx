'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { Heart, Sparkles } from 'lucide-react';

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

export default function PaginaCasal() {
  const params = useParams();
  const slug = params?.slug as string;

  const [pagina, setPagina] = useState<{ nomeCasal: string; dataInicio: string; mensagem: string; fotoUrl: string; spotifyTrackId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

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
        {pagina.spotifyTrackId && (
          <div className="w-full rounded-2xl overflow-hidden shadow-md">
            <iframe
              src={`https://open.spotify.com/embed/track/${pagina.spotifyTrackId}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            ></iframe>
          </div>
        )}

        <div className="relative w-52 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
          <img src={pagina.fotoUrl || 'https://via.placeholder.com/300'} alt="Casal" className="w-full h-full object-cover" />
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

        <div className="pt-2 flex justify-center text-rose-500">
          <Heart className="animate-pulse fill-rose-500" size={28} />
        </div>
      </div>
    </div>
  );
}