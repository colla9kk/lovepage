'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Heart, Sparkles } from 'lucide-react';

export default function PaginaCasal() {
  const params = useParams();
  const slug = params?.slug as string;

  const [pagina, setPagina] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  useEffect(() => {
    if (!slug) return;
    fetch('http://localhost:5000/api/pages/' + slug)
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-rose-400 font-medium animate-pulse">Carregando surpresa romântica...</p>
      </div>
    );
  }

  if (erro || !pagina) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Heart className="text-slate-700 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-rose-400 mb-2">Página não encontrada</h1>
        <p className="text-slate-400">Esta página especial não existe ou o link está incorreto.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-6 my-8">
        <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-rose-500 shadow-xl shadow-rose-950">
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
        <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-slate-300 text-base whitespace-pre-line text-left leading-relaxed shadow-sm">
          {pagina.mensagem}
        </div>
        <div className="pt-2 flex justify-center text-rose-500">
          <Heart className="animate-pulse fill-rose-500" size={28} />
        </div>
      </div>
    </div>
  );
}
