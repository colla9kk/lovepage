'use client';
import { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';

type Session = { orderId: string; token: string };
type Draft = { nomeCasal: string; dataInicio: string; mensagem: string; fotoUrl: string; spotifyTrackId: string; email: string; cpf: string };
type Checkout = { pageData: Omit<Draft, 'email' | 'cpf'>; status: string; result: { url: string; qrCode: string } | null; qrCodeBase64: string | null; qrCodeCopiaCola: string };
const KEY = 'lovepage.checkout.v1';
const terminal = new Set(['cancelled', 'rejected', 'refunded', 'charged_back']);
export function useCheckout() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore browser-only storage after hydration; the server cannot read it.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (typeof parsed.orderId === 'string' && /^[a-f0-9]{64}$/.test(parsed.token)) setSession(parsed);
      }
    } catch { setError('Permita o armazenamento neste navegador para recuperar sua compra.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!session || checkout?.result || terminal.has(checkout?.status || '')) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      if (busy.current) { timer = setTimeout(poll, 3000); return; }
      try {
        const res = await fetch(`${API_URL}/api/checkout/orders/${session!.orderId}`, {
          headers: { Authorization: `Bearer ${session!.token}` },
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]), cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404 && !stopped) {
            localStorage.removeItem(KEY); setSession(null);
            throw new Error('Pedido não encontrado. Preencha os dados e tente novamente.');
          }
          throw new Error(data.error || 'Não foi possível consultar o pedido.');
        }
        if (!stopped) { setCheckout(data); setError(''); }
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : 'Conexão interrompida. Tentaremos novamente.');
      } finally { if (!stopped) timer = setTimeout(poll, 3000); }
    }
    void poll();
    return () => { stopped = true; controller.abort(); clearTimeout(timer); };
  }, [session, checkout?.result, checkout?.status]);
  async function start(draft: Draft) {
    if (busy.current || session || !ready) return;
    busy.current = true; setLoading(true); setError('');
    const next = { orderId: crypto.randomUUID(), token: Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('') };
    try {
      // Persist the recovery key before creating a charge. Never store CPF or the photo here.
      localStorage.setItem(KEY, JSON.stringify(next));
      setSession(next);
      const res = await fetch(`${API_URL}/api/checkout/pix`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${next.token}` },
        body: JSON.stringify({ ...draft, orderId: next.orderId }), signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      if (!res.ok) {
        if ([400, 413, 429].includes(res.status)) { localStorage.removeItem(KEY); setSession(null); }
        throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
      }
      setCheckout(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar o pagamento.'); }
    finally { busy.current = false; setLoading(false); }
  }
  async function cancelPending() {
    if (busy.current || !session || checkout?.result || terminal.has(checkout?.status || '')) return false;
    busy.current = true; setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/checkout/orders/${session.orderId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível cancelar o PIX anterior.');
      localStorage.removeItem(KEY); setSession(null); setCheckout(null); setError('');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar o PIX anterior.');
      return false;
    } finally {
      busy.current = false; setLoading(false);
    }
  }

  function reset() {
    if (!checkout?.result && !terminal.has(checkout?.status || '')) return;
    localStorage.removeItem(KEY); setSession(null); setCheckout(null); setError('');
  }
  return { start, cancelPending, reset, session, checkout, ready, loading, error, terminal: terminal.has(checkout?.status || '') };
}
