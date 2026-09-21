'use client';

import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Home, MessageCircle, Music, Sparkles } from 'lucide-react';

type Template = 'romantic' | 'friend' | 'family';

const demos = {
  romantic: {
    names: 'Lucas & Sofia',
    relation: 'desde 14 de fevereiro de 2023',
    message: 'Eu escolheria você em todas as versões da minha vida. Obrigado por transformar dias comuns nas minhas memórias favoritas.',
    highlights: [] as string[],
    photos: [
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  friend: {
    names: 'Rafa',
    relation: 'meu parceiro de todas as resenhas',
    message: 'Tem gente que chega e vira parte da rotina. Você virou parte das histórias que eu mais gosto de contar. Valeu por cada rolê, conselho e risada sem sentido.',
    highlights: [
      'A viagem que era pra ser tranquila e virou história até hoje',
      'As conversas de madrugada quando ninguém mais entendia nada',
      'A certeza de que sempre tem alguém pra chamar quando dá ruim',
    ],
    photos: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  family: {
    names: 'Mãe',
    relation: 'minha maior referência',
    message: 'Obrigado por estar em cada fase, por acreditar quando eu mesmo duvidei e por fazer da nossa casa um lugar que sempre dá vontade de voltar.',
    highlights: [
      'Seu jeito de cuidar sem precisar dizer nada',
      'Os almoços que juntam todo mundo de novo',
      'Tudo que você ensinou pelo exemplo',
    ],
    photos: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=1000&auto=format&fit=crop',
    ],
  },
} satisfies Record<Template, {
  names: string;
  relation: string;
  message: string;
  highlights: string[];
  photos: string[];
}>;

function Carousel({ photos, square = false }: { photos: string[]; square?: boolean }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="space-y-3">
      <div className={`relative overflow-hidden shadow-2xl ${square ? 'aspect-square' : 'aspect-[4/5]'}`}>
        <img src={photos[index]} alt="Exemplo de foto do presente" className="w-full h-full object-cover" />
        <button
          onClick={() => setIndex(value => (value - 1 + photos.length) % photos.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center"
          aria-label="Foto anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setIndex(value => (value + 1) % photos.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center"
          aria-label="Próxima foto"
        >
          <ChevronRight size={20} />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
          {index + 1} / {photos.length}
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {photos.map((_, photoIndex) => (
          <button
            key={photoIndex}
            onClick={() => setIndex(photoIndex)}
            className={`h-2 rounded-full transition-all ${index === photoIndex ? 'w-7 bg-current' : 'w-2 bg-current opacity-30'}`}
            aria-label={`Ver foto ${photoIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function DemoTop({ template }: { template: Template }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <a href="/" className="text-sm text-white/80 hover:text-white inline-flex items-center gap-2">
          <ArrowLeft size={16} /> LovePage
        </a>
        <span className="hidden sm:inline text-xs text-white/50">Você está vendo uma demonstração</span>
        <a
          href={`/?modelo=${template}#criar`}
          className="bg-white text-slate-950 font-bold text-sm px-4 py-2 rounded-xl hover:scale-[1.02] transition"
        >
          Usar este modelo
        </a>
      </div>
    </div>
  );
}

export default function DemoGiftClient({ template }: { template: Template }) {
  const data = demos[template];

  if (template === 'friend') {
    return (
      <div className="min-h-screen bg-[#04131f] text-white pt-14">
        <DemoTop template={template} />
        <div className="fixed inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 15% 10%, rgba(34,211,238,.18), transparent 25%), radial-gradient(circle at 80% 75%, rgba(59,130,246,.18), transparent 30%)' }} />
        <main className="relative z-10 max-w-2xl mx-auto px-4 py-10 md:py-16">
          <p className="text-cyan-300 text-xs uppercase tracking-[0.3em] font-bold">uma página pra quem tá em todas 🤝</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mt-3 leading-[0.92]">{data.names}</h1>
          <p className="text-cyan-100/70 mt-3 text-lg">{data.relation}</p>

          <div className="mt-8 bg-white p-3 pb-10 shadow-2xl rotate-[-1deg]">
            <Carousel photos={data.photos} square />
            <p className="text-slate-800 text-center font-medium mt-4">uma das histórias que a gente vai contar por anos ✦</p>
          </div>

          <section className="mt-10">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-bold mb-3">por que essa amizade é diferente</p>
            <div className="grid gap-3">
              {data.highlights.map((item, index) => (
                <div key={item} className="rounded-2xl border border-cyan-400/20 bg-cyan-300/[0.06] p-4 flex gap-4">
                  <span className="text-cyan-300 text-xl font-black">0{index + 1}</span>
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[28px] bg-white/[0.06] border border-white/10 p-7">
            <p className="text-cyan-300 text-xs uppercase tracking-[0.25em] font-bold mb-3">pra você</p>
            <p className="text-lg leading-8">{data.message}</p>
          </section>

          <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan-300 text-slate-950 flex items-center justify-center"><Music size={20} /></div>
            <div><b>Trilha sonora da amizade</b><p className="text-sm text-cyan-100/60">O cliente pode colocar uma música do Spotify.</p></div>
          </div>

          <a href="/?modelo=friend#criar" className="mt-8 w-full bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2">
            <MessageCircle size={20} /> Criar uma página de amizade
          </a>
        </main>
      </div>
    );
  }

  if (template === 'family') {
    return (
      <div className="min-h-screen bg-[#f4ead9] text-[#38291b] pt-14">
        <DemoTop template={template} />
        <main className="max-w-2xl mx-auto px-4 py-10 md:py-16">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#dfc69e] flex items-center justify-center mx-auto text-3xl"><Home size={28} /></div>
            <p className="text-[#8b673e] text-xs uppercase tracking-[0.25em] font-bold mt-5">uma homenagem feita com carinho</p>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mt-3">{data.names}</h1>
            <p className="text-[#7d664e] mt-2 text-lg">{data.relation}</p>
          </div>

          <div className="mt-8 text-[#7b5835]">
            <Carousel photos={data.photos} />
          </div>

          <section className="mt-10">
            <p className="text-center text-xs uppercase tracking-[0.24em] text-[#9a7145] font-bold mb-4">coisas que guardo no coração</p>
            <div className="grid md:grid-cols-3 gap-3">
              {data.highlights.map((item) => (
                <div key={item} className="bg-[#fffaf2] border border-[#e6d4b9] rounded-2xl p-5 shadow-sm">
                  <span className="text-[#b78650] text-xl">✦</span>
                  <p className="font-serif leading-6 mt-2">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-9 bg-[#fffaf2] border border-[#e4d1b3] rounded-[32px] p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-[#a07343] font-bold mb-4">uma mensagem pra você</p>
            <p className="font-serif text-xl md:text-2xl leading-9">{data.message}</p>
          </section>

          <div className="mt-8 rounded-2xl border border-[#d9c09a] bg-[#fffaf2] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#dfc69e] flex items-center justify-center"><Music size={20} /></div>
            <div><b>Uma música especial</b><p className="text-sm text-[#7d664e]">Também dá pra colocar uma música do Spotify na homenagem.</p></div>
          </div>

          <a href="/?modelo=family#criar" className="mt-8 w-full bg-[#7b5835] hover:bg-[#68492c] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Heart size={20} /> Criar uma homenagem
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-14 relative overflow-hidden">
      <DemoTop template={template} />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(225,29,72,.16),transparent_35%)]" />
      <main className="relative z-10 max-w-md mx-auto px-4 py-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-6">
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 to-fuchsia-500/10 p-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-600 flex items-center justify-center"><Music size={22} /></div>
            <p className="text-rose-300 font-semibold mt-3">Tem uma música para você</p>
            <p className="text-xs text-slate-400 mt-1">A música do casal fica escondida até a pessoa tocar.</p>
          </div>

          <div className="text-rose-400">
            <Carousel photos={data.photos} />
          </div>

          <h1 className="text-3xl font-bold text-rose-400 flex items-center justify-center gap-2">
            <Sparkles className="text-amber-400" size={22} /> {data.names}
          </h1>
          <p className="text-sm text-slate-400">{data.relation}</p>

          <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Juntos há</p>
            <div className="grid grid-cols-4 gap-2">
              {[['950','dias'],['08','horas'],['31','min'],['42','seg']].map(([value, label]) => (
                <div key={label} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="block text-xl font-bold text-rose-400">{value}</span>
                  <span className="text-[10px] text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-slate-300 text-left leading-relaxed">
            {data.message}
          </div>

          <a href="/?modelo=romantic#criar" className="w-full bg-rose-600 hover:bg-rose-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <Heart size={20} className="fill-white" /> Criar uma página romântica
          </a>
        </div>
      </main>
    </div>
  );
}
