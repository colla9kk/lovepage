'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Image as ImageIcon, Calendar, Sparkles, Clock } from 'lucide-react';

export default function Home() {
  // Estados do formulário
  const [nomeCasal, setNomeCasal] = useState('Matheus & Marianne');
  const [dataInicio, setDataInicio] = useState('2024-01-01');
  const [mensagem, setMensagem] = useState('Cada segundo ao seu lado é um presente inesquecível. Te amo!');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800');

  // Estado do contador de tempo
  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  // Lógica do contador em tempo real
  useEffect(() => {
    const calcularTempo = () => {
      if (!dataInicio) return;
      const inicio = new Date(dataInicio).getTime();
      const agora = new Date().getTime();
      const diferenca = Math.max(0, agora - inicio);

      const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

      setTempo({ dias, horas, minutos, segundos });
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);
    return () => clearInterval(interval);
  }, [dataInicio]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Cabeçalho */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur p-4 flex justify-between items-center px-6">
        <div className="flex items-center gap-2 text-rose-500 font-bold text-xl">
          <Heart className="fill-rose-500" size={24} />
          <span>LovePage</span>
        </div>
        <button className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-full transition shadow-lg shadow-rose-950">
          Gerar QR Code & Link
        </button>
      </header>

      {/* Conteúdo Principal: Editor + Prévia */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 max-w-7xl mx-auto w-full">
        
        {/* Lado Esquerdo: Formulário de Configuração */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-amber-400" size={22} /> Personalize seu Presente
            </h1>
            <p className="text-slate-400 text-sm mt-1">Preencha os campos e veja a mágica acontecer ao vivo ao lado.</p>
          </div>

          <div className="space-y-4">
            {/* Nome do Casal */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Casal</label>
              <input
                type="text"
                value={nomeCasal}
                onChange={(e) => setNomeCasal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Ex: Matheus e Maria"
              />
            </div>

            {/* Data de Início */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Calendar size={16} /> Data do Início do Relacionamento
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Mensagem Romântica */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Sua Carta / Mensagem</label>
              <textarea
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Escreva sua mensagem especial..."
              />
            </div>

            {/* URL da Foto de Capa */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <ImageIcon size={16} /> URL da Foto do Casal
              </label>
              <input
                type="text"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Cole o link de uma imagem"
              />
            </div>
          </div>
        </section>

        {/* Lado Direito: Prévia Interativa (Mobile Mockup) */}
        <section className="flex flex-col items-center justify-center">
          <div className="text-slate-400 text-sm mb-3 flex items-center gap-2">
            <Clock size={16} /> Prévia em tempo real de como o presente vai ficar:
          </div>

          {/* Moldura de Celular */}
          <div className="w-full max-w-[360px] h-[680px] bg-slate-950 border-[8px] border-slate-800 rounded-[40px] shadow-2xl overflow-y-auto relative flex flex-col p-6 text-center text-white">
            
            {/* Foto de Capa */}
            <div className="relative w-44 h-44 mx-auto my-4 rounded-full overflow-hidden border-4 border-rose-500/80 shadow-lg shadow-rose-950">
              <img
                src={fotoUrl || "https://via.placeholder.com/300"}
                alt="Foto do casal"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Nomes */}
            <h2 className="text-2xl font-bold text-rose-400 mt-2">{nomeCasal || "Seus Nomes"}</h2>

            {/* Contador de Tempo */}
            <div className="my-6 bg-slate-900/80 border border-rose-500/20 rounded-xl p-4 shadow-inner">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Juntos Há</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-950 p-2 rounded-lg">
                  <span className="block text-lg font-bold text-rose-400">{tempo.dias}</span>
                  <span className="text-[10px] text-slate-400">Dias</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg">
                  <span className="block text-lg font-bold text-rose-400">{tempo.horas}</span>
                  <span className="text-[10px] text-slate-400">Horas</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg">
                  <span className="block text-lg font-bold text-rose-400">{tempo.minutos}</span>
                  <span className="text-[10px] text-slate-400">Min</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg">
                  <span className="block text-lg font-bold text-rose-400">{tempo.segundos}</span>
                  <span className="text-[10px] text-slate-400">Seg</span>
                </div>
              </div>
            </div>

            {/* Carta / Mensagem */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm whitespace-pre-line text-left leading-relaxed">
              {mensagem || "Sua mensagem aparecerá aqui..."}
            </div>

            {/* Rodapé Romântico */}
            <div className="mt-auto pt-6 flex justify-center text-rose-500/60">
              <Heart className="animate-pulse fill-rose-500" size={20} />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}