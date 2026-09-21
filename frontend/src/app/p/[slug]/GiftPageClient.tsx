'use client';

import React, { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { trackMetric } from '@/lib/metrics';
import { Heart, Sparkles, MessageCircle, Music, Play, ChevronLeft, ChevronRight } from 'lucide-react';

type GiftTemplate = 'romantic' | 'friend' | 'family' | 'midnight' | 'minimal';

type PageData = {
  nomeCasal: string;
  dataInicio: string;
  mensagem: string;
  fotoUrl: string;
  fotoUrls?: string[];
  spotifyTrackId?: string;
  theme?: GiftTemplate;
  relationLabel?: string;
  highlights?: string[];
};

function ChuvaDeCoracoes() {
  const coracoes = Array.from({ length: 25 }, (_, id) => ({
    id,
    left: (id * 37 % 92) + 4,
    delay: (id * 17 % 60) / 10,
    duration: 4 + (id * 13 % 50) / 10,
    size: 14 + (id * 7 % 16),
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
          0% { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          50% { transform: translateY(50vh) translateX(20px) rotate(180deg); }
          90% { opacity: 0.8; }
          100% { transform: translateY(105vh) translateX(-20px) rotate(360deg); opacity: 0; }
        }
        .animate-cairEBalancar { animation: cairEBalancar infinite linear; }
      `}</style>
    </div>
  );
}

function MusicReveal({
  trackId,
  revealed,
  onReveal,
  template,
}: {
  trackId?: string;
  revealed: boolean;
  onReveal: () => void;
  template: 'romantic' | 'friend' | 'family';
}) {
  if (!trackId) return null;

  const copy = {
    romantic: {
      title: 'Tem uma música para você',
      subtitle: 'Toque para revelar a música de vocês 🎵',
      label: 'A música de vocês 💖',
      button: 'from-rose-500/15 to-fuchsia-500/10 border-rose-500/30',
      icon: 'bg-rose-600',
      text: 'text-rose-300',
    },
    friend: {
      title: 'Tem uma trilha pra essa amizade',
      subtitle: 'Aquela música que lembra as resenhas de vocês 🎵',
      label: 'Trilha sonora da amizade ✦',
      button: 'from-cyan-500/15 to-blue-500/10 border-cyan-400/30',
      icon: 'bg-cyan-500 text-slate-950',
      text: 'text-cyan-300',
    },
    family: {
      title: 'Uma música que lembra você',
      subtitle: 'Toque para ouvir esse detalhe da homenagem 🎵',
      label: 'Uma música especial ♡',
      button: 'from-amber-400/15 to-orange-500/10 border-amber-300/25',
      icon: 'bg-amber-300 text-amber-950',
      text: 'text-amber-200',
    },
  }[template];

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={onReveal}
        className={`w-full group bg-gradient-to-br ${copy.button} border rounded-2xl p-5 transition shadow-lg`}
      >
        <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition ${copy.icon}`}>
          <Play size={24} className="fill-current ml-1" />
        </div>
        <div className={`mt-3 flex items-center justify-center gap-2 font-semibold ${copy.text}`}>
          <Music size={18} /> {copy.title}
        </div>
        <p className="text-xs text-slate-400 mt-1">{copy.subtitle}</p>
      </button>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in">
      <div className={`flex items-center justify-center gap-2 text-sm font-medium ${copy.text}`}>
        <Music size={16} /> {copy.label}
      </div>
      <div className="w-full rounded-2xl overflow-hidden shadow-md border border-white/10">
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>
      <p className="text-[11px] text-slate-500">Se o navegador não iniciar sozinho, toque no play do Spotify.</p>
    </div>
  );
}

function PhotoCarousel({
  fotos,
  index,
  setIndex,
  className = '',
  imageClassName = '',
}: {
  fotos: string[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  className?: string;
  imageClassName?: string;
}) {
  const current = fotos[index] || fotos[0];

  return (
    <div className="space-y-3">
      <div className={`relative overflow-hidden shadow-2xl bg-slate-950 ${className}`}>
        <img src={current} alt={`Memória ${index + 1}`} className={`w-full h-full object-cover ${imageClassName}`} />
        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex(value => (value - 1 + fotos.length) % fotos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => setIndex(value => (value + 1) % fotos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur"
              aria-label="Próxima foto"
            >
              <ChevronRight size={22} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/65 backdrop-blur px-3 py-1 rounded-full text-xs text-white">
              {index + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, photoIndex) => (
            <button
              key={photoIndex}
              type="button"
              onClick={() => setIndex(photoIndex)}
              className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition ${photoIndex === index ? 'border-white scale-105' : 'border-white/15 opacity-65 hover:opacity-100'}`}
              aria-label={`Ver foto ${photoIndex + 1}`}
            >
              <img src={foto} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GiftPageClient({ slug }: { slug: string }) {
  const [pagina, setPagina] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [musicaRevelada, setMusicaRevelada] = useState(false);
  const [fotoAtual, setFotoAtual] = useState(0);

  useEffect(() => {
    if (!slug) return;
    const key = `lovepage.metric.page_view.${slug}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      trackMetric('page_view', { pageSlug: slug });
    }

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
      const agora = Date.now();
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

  const storedTheme = pagina?.theme || 'romantic';
  const template: 'romantic' | 'friend' | 'family' =
    storedTheme === 'friend' || storedTheme === 'family' ? storedTheme : 'romantic';
  const highlights = pagina?.highlights?.filter(Boolean).slice(0, 3) || [];

  const compartilharWhatsApp = () => {
    trackMetric('whatsapp_share', { pageSlug: slug });
    const prefix = template === 'friend'
      ? '🤝 Fiz uma página pra guardar nossa amizade:'
      : template === 'family'
        ? '🏡 Fiz uma homenagem especial pra você:'
        : '💖 Fiz uma surpresa especial para você:';
    const texto = `${prefix} ${pagina?.nomeCasal || 'LovePage'}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <p className="text-rose-400 font-medium animate-pulse text-lg flex items-center gap-2">
          <Sparkles className="animate-spin" size={20} /> Carregando presente...
        </p>
      </div>
    );
  }

  if (erro || !pagina || !fotos.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Heart className="text-slate-700 mb-4" size={56} />
        <h1 className="text-2xl font-bold text-rose-400 mb-2">Página não encontrada</h1>
        <p className="text-slate-400">Esta página especial não existe ou o link está incorreto.</p>
      </div>
    );
  }

  if (template === 'friend') {
    const fallbackHighlights = [
      'As resenhas que só vocês entendem',
      'A parceria quando mais importa',
      'Memórias que viraram história',
    ];
    const items = highlights.length ? highlights : fallbackHighlights;

    return (
      <div className="min-h-screen bg-[#04131f] text-white overflow-x-hidden relative">
        <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 15%, rgba(34,211,238,.18), transparent 28%), radial-gradient(circle at 80% 70%, rgba(59,130,246,.15), transparent 30%)' }} />

        <main className="relative z-10 max-w-2xl mx-auto px-4 py-10 md:py-16">
          <section className="text-left mb-8">
            <p className="text-cyan-300 text-xs uppercase tracking-[0.3em] font-bold">uma página pra quem tá em todas 🤝</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-3 leading-[0.95]">{pagina.nomeCasal}</h1>
            <p className="text-cyan-100/70 mt-3 text-lg">{pagina.relationLabel || 'amizade que virou família'}</p>
          </section>

          <div className="bg-white p-3 pb-10 shadow-2xl rotate-[-1deg] mb-8">
            <div className="aspect-square">
              <PhotoCarousel fotos={fotos} index={fotoAtual} setIndex={setFotoAtual} className="w-full h-full rounded-none" />
            </div>
            <p className="text-slate-800 text-center text-sm font-medium mt-3">uma das histórias que a gente vai contar por anos ✦</p>
          </div>

          <section className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-bold mb-3">por que essa amizade é diferente</p>
            <div className="grid gap-3">
              {items.slice(0, 3).map((item, index) => (
                <div key={index} className="rounded-2xl border border-cyan-400/20 bg-cyan-300/[0.06] p-4 flex gap-4 items-start">
                  <span className="text-cyan-300 text-xl font-black">0{index + 1}</span>
                  <p className="text-slate-100 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-white/[0.06] border border-white/10 p-6 md:p-8 mb-8">
            <p className="text-cyan-300 text-xs uppercase tracking-[0.25em] font-bold mb-3">pra você</p>
            <p className="text-lg leading-8 text-slate-100 whitespace-pre-line">{pagina.mensagem}</p>
          </section>

          <div className="mb-8">
            <MusicReveal trackId={pagina.spotifyTrackId} revealed={musicaRevelada} onReveal={() => setMusicaRevelada(true)} template="friend" />
          </div>

          <button onClick={compartilharWhatsApp} className="w-full bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-black py-4 rounded-2xl transition flex items-center justify-center gap-2">
            <MessageCircle size={20} /> Compartilhar essa amizade
          </button>

          <p className="text-center text-cyan-100/40 text-xs mt-6">✦ amizade boa é casa ✦</p>
        </main>
      </div>
    );
  }

  if (template === 'family') {
    return (
      <div className="min-h-screen bg-[#f4ead9] text-[#38291b] overflow-x-hidden relative">
        <main className="max-w-2xl mx-auto px-4 py-10 md:py-16">
          <section className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#dfc69e] flex items-center justify-center mx-auto text-3xl shadow-sm">🏡</div>
            <p className="text-[#8b673e] text-xs uppercase tracking-[0.25em] font-bold mt-5">uma homenagem feita com carinho</p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mt-3 leading-tight">{pagina.nomeCasal}</h1>
            {pagina.relationLabel && <p className="text-[#7d664e] mt-2 text-lg">{pagina.relationLabel}</p>}
          </section>

          <PhotoCarousel
            fotos={fotos}
            index={fotoAtual}
            setIndex={setFotoAtual}
            className="w-full aspect-[4/3] rounded-[32px] border-[6px] border-white shadow-xl"
          />

          {highlights.length > 0 && (
            <section className="mt-9">
              <p className="text-center text-xs uppercase tracking-[0.24em] text-[#9a7145] font-bold mb-4">coisas que guardo no coração</p>
              <div className="grid md:grid-cols-3 gap-3">
                {highlights.map((item, index) => (
                  <div key={index} className="bg-[#fffaf2] border border-[#e6d4b9] rounded-2xl p-5 shadow-sm">
                    <span className="text-[#b78650] text-xl">✦</span>
                    <p className="font-serif text-base leading-6 mt-2">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-9 bg-[#fffaf2] border border-[#e4d1b3] rounded-[32px] p-7 md:p-9 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-[#a07343] font-bold mb-4">uma mensagem pra você</p>
            <p className="font-serif text-xl md:text-2xl leading-9 whitespace-pre-line">{pagina.mensagem}</p>
          </section>

          <div className="mt-9">
            <MusicReveal trackId={pagina.spotifyTrackId} revealed={musicaRevelada} onReveal={() => setMusicaRevelada(true)} template="family" />
          </div>

          <button onClick={compartilharWhatsApp} className="mt-8 w-full bg-[#7b5835] hover:bg-[#68492c] text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2">
            <MessageCircle size={20} /> Compartilhar homenagem
          </button>

          <p className="text-center text-[#8b735b] text-xs mt-6">com carinho, sempre ♡</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-x-hidden">
      <ChuvaDeCoracoes />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-6 my-8 relative z-20">
        <MusicReveal trackId={pagina.spotifyTrackId} revealed={musicaRevelada} onReveal={() => setMusicaRevelada(true)} template="romantic" />

        <PhotoCarousel
          fotos={fotos}
          index={fotoAtual}
          setIndex={setFotoAtual}
          className="w-full max-w-sm aspect-[4/5] mx-auto rounded-2xl border-2 border-slate-700"
        />

        <h1 className="text-3xl font-bold text-rose-400 flex items-center justify-center gap-2">
          <Sparkles className="text-amber-400" size={24} />
          {pagina.nomeCasal}
        </h1>

        <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-4 shadow-inner">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Juntos há</p>
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
          <MessageCircle size={20} /> Compartilhar no WhatsApp
        </button>

        <p className="text-xs text-slate-500">Envie esta surpresa para quem você ama 💖</p>

        <div className="pt-2 flex justify-center text-rose-500">
          <Heart className="animate-pulse fill-rose-500" size={28} />
        </div>
      </div>
    </div>
  );
}
