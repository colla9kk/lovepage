'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Image as ImageIcon, Calendar, Sparkles, Clock, QrCode, Copy, Check, Music } from 'lucide-react';

// Componente da Chuva de Corações com balanço suave (idêntico ao seu site)
function ChuvaDeCoracoes() {
  const [coracoes, setCoracoes] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    // Gera 25 corações espalhados pela tela
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
  const [spotifyTrackId, setSpotifyTrackId] = useState('4cOdK2wGLETKBW3PvgPWqT'); // ID da música Jorge & Mateus por padrão

  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ url: string; qrCode: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

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

  const gerarPagina = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCasal, dataInicio, mensagem, fotoUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setResultado({ url: data.url, qrCode: data.qrCode });
      }
    } catch (e) {
      alert('Erro ao conectar com o servidor.');
    }
    setLoading(false);
  };

  const copiarLink = () => {
    if (resultado) {
      navigator.clipboard.writeText(resultado.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur p-4 flex justify-between items-center px-6">
        <div className="flex items-center gap-2 text-rose-500 font-bold text-xl">
          <Heart className="fill-rose-500" size={24} />
          <span>LovePage SaaS</span>
        </div>
        <button
          onClick={gerarPagina}
          disabled={loading}
          className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-5 py-2.5 rounded-full transition shadow-lg shadow-rose-950 flex items-center gap-2"
        >
          <QrCode size={18} /> {loading ? 'Gerando...' : 'Gerar QR Code & Link'}
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 max-w-7xl mx-auto w-full">
        {/* Formulário */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-amber-400" size={22} /> Personalize seu Presente
            </h1>
            <p className="text-slate-400 text-sm mt-1">Preencha os campos e veja a prévia em tempo real ao lado.</p>
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
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <ImageIcon size={16} /> URL da Foto do Casal
              </label>
              <input type="text" value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Carta / Mensagem Romântica</label>
              <textarea rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>

          {resultado && (
            <div className="mt-6 bg-slate-950 border border-rose-500/40 p-4 rounded-xl space-y-4 text-center">
              <h3 className="font-bold text-rose-400 text-lg flex items-center justify-center gap-2">
                <Sparkles size={18} /> Página Gerada com Sucesso!
              </h3>
              <div className="bg-white p-3 inline-block rounded-xl shadow-md">
                <img src={resultado.qrCode} alt="QR Code" className="w-36 h-36 mx-auto" />
              </div>
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <input type="text" readOnly value={resultado.url} className="bg-transparent text-xs text-slate-300 w-full outline-none px-2" />
                <button onClick={copiarLink} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 transition">
                  {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Lado Direito: Prévia com Player do Spotify + Chuva de Corações */}
        <section className="flex flex-col items-center justify-center">
          <div className="text-slate-400 text-sm mb-3 flex items-center gap-2">
            <Clock size={16} /> Prévia da página em tempo real:
          </div>

          <div className="w-full max-w-[360px] h-[680px] bg-slate-950 border-[8px] border-slate-800 rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col p-4 text-center text-white">
            
            {/* Chuva de Corações Flutuantes */}
            <ChuvaDeCoracoes />

            <div className="relative z-20 flex flex-col h-full overflow-y-auto space-y-4 pr-1">
              
              {/* Player do Spotify no Topo */}
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

              {/* Foto Principal */}
              <div className="relative w-52 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl shrink-0">
                <img src={fotoUrl || 'https://via.placeholder.com/300'} alt="Casal" className="w-full h-full object-cover" />
              </div>

              {/* Nomes */}
              <h2 className="text-2xl font-bold text-rose-400">{nomeCasal || 'Seus Nomes'}</h2>

              {/* Contador de Tempo */}
              <div className="bg-slate-900/90 border border-rose-500/20 rounded-xl p-3 shadow-inner">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Juntos Há</p>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.dias}</span><span className="text-[9px] text-slate-400">Dias</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.horas}</span><span className="text-[9px] text-slate-400">Horas</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.minutos}</span><span className="text-[9px] text-slate-400">Min</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg"><span className="block text-base font-bold text-rose-400">{tempo.segundos}</span><span className="text-[9px] text-slate-400">Seg</span></div>
                </div>
              </div>

              {/* Carta / Mensagem */}
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
    </div>
  );
}