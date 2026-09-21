'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BarChart3, ExternalLink, Heart, Lock, RefreshCw, ShoppingCart } from 'lucide-react';

type Dashboard = {
  summary: {
    totalOrders: number;
    approvedOrders: number;
    approvedOrders30d: number;
    pendingOrders: number;
    cancelledOrders: number;
    pages: number;
    revenueCents: number;
  };
  metrics30d: {
    landingViews: number;
    checkoutClicks: number;
    pageViews: number;
    whatsappShares: number;
  };
  orders: Array<{
    id: string;
    status: string;
    amountCents: number;
    paymentId: string | null;
    createdAt: string;
    updatedAt: string;
    nomeCasal: string;
    pageSlug: string | null;
    theme: string | null;
  }>;
};

const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('lovepage.admin.password') || '';
    if (saved) {
      setPassword(saved);
      void load(saved);
    }
  }, []);

  async function load(secret = password) {
    if (!secret) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${secret}` },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível abrir o painel.');
      sessionStorage.setItem('lovepage.admin.password', secret);
      setDashboard(data);
    } catch (cause) {
      setDashboard(null);
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o painel.');
    } finally {
      setLoading(false);
    }
  }

  const conversion = useMemo(() => {
    if (!dashboard?.metrics30d.landingViews) return 0;
    return Math.round((dashboard.summary.approvedOrders30d / dashboard.metrics30d.landingViews) * 1000) / 10;
  }, [dashboard]);

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <form
          onSubmit={e => { e.preventDefault(); void load(); }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center">
              <Heart className="text-rose-400 fill-rose-400" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel LovePage</h1>
              <p className="text-sm text-slate-400">Pedidos, vendas e métricas.</p>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 block mb-2">Senha administrativa</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Digite a senha do painel"
            />
          </div>

          {error && <p className="text-sm text-amber-300">{error}</p>}

          <button
            disabled={loading || !password}
            className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
          >
            <Lock size={17} /> {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-5 md:p-8">
      <div className="max-w-7xl mx-auto space-y-7">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold"><Heart className="fill-rose-400" size={20} /> LovePage Admin</div>
            <h1 className="text-3xl font-bold mt-1">Visão geral</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('lovepage.admin.password'); setDashboard(null); setPassword(''); }}
              className="border border-slate-700 px-4 py-2 rounded-xl text-sm text-slate-300"
            >
              Sair
            </button>
          </div>
        </header>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Faturamento', money(dashboard.summary.revenueCents)],
            ['Pagos', String(dashboard.summary.approvedOrders)],
            ['Pendentes', String(dashboard.summary.pendingOrders)],
            ['Páginas criadas', String(dashboard.summary.pages)],
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-2xl font-bold mt-2">{value}</p>
            </div>
          ))}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-rose-400" /><h2 className="font-bold">Últimos 30 dias</h2></div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-center">
            <div className="bg-slate-950 rounded-xl p-4"><b className="text-xl">{dashboard.metrics30d.landingViews}</b><span className="block text-xs text-slate-500 mt-1">visitas</span></div>
            <div className="bg-slate-950 rounded-xl p-4"><b className="text-xl">{dashboard.metrics30d.checkoutClicks}</b><span className="block text-xs text-slate-500 mt-1">cliques no PIX</span></div>
            <div className="bg-slate-950 rounded-xl p-4"><b className="text-xl">{dashboard.metrics30d.pageViews}</b><span className="block text-xs text-slate-500 mt-1">presentes abertos</span></div>
            <div className="bg-slate-950 rounded-xl p-4"><b className="text-xl">{dashboard.metrics30d.whatsappShares}</b><span className="block text-xs text-slate-500 mt-1">shares WhatsApp</span></div>
            <div className="bg-slate-950 rounded-xl p-4"><b className="text-xl">{conversion}%</b><span className="block text-xs text-slate-500 mt-1">visita → pago*</span></div>
          </div>
          <p className="text-[11px] text-slate-600 mt-3">* Conversão usa eventos registrados a partir da ativação das métricas.</p>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2"><ShoppingCart size={18} className="text-rose-400" /><h2 className="font-bold">Pedidos recentes</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="text-left text-slate-500 bg-slate-950/60">
                <tr><th className="p-3">Casal</th><th className="p-3">Status</th><th className="p-3">Valor</th><th className="p-3">Criado</th><th className="p-3">Tema</th><th className="p-3">Página</th></tr>
              </thead>
              <tbody>
                {dashboard.orders.map(order => (
                  <tr key={order.id} className="border-t border-slate-800">
                    <td className="p-3 font-medium">{order.nomeCasal}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${order.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300' : order.status === 'pending' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>{order.status}</span></td>
                    <td className="p-3">{money(order.amountCents)}</td>
                    <td className="p-3 text-slate-400">{date(order.createdAt)}</td>
                    <td className="p-3 text-slate-400">{order.theme || '—'}</td>
                    <td className="p-3">
                      {order.pageSlug ? (
                        <a href={`/p/${order.pageSlug}`} target="_blank" rel="noreferrer" className="text-rose-300 hover:text-rose-200 inline-flex items-center gap-1">
                          Abrir <ExternalLink size={13} />
                        </a>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
