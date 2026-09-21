import { CheckCircle2, Lock, ShieldCheck, Smartphone, Zap } from 'lucide-react';

export function CheckoutTrust() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-semibold text-slate-100">Pagamento processado pelo Mercado Pago</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Pagamento único via PIX. CPF e e-mail são usados na etapa de pagamento e não aparecem no presente.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 mt-4 text-xs">
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 flex items-center gap-2">
          <Lock size={13} className="text-emerald-400" /> dados fora da página pública
        </div>
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 flex items-center gap-2">
          <Zap size={13} className="text-amber-300" /> liberação automática após aprovação
        </div>
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2 flex items-center gap-2">
          <CheckCircle2 size={13} className="text-rose-300" /> sem assinatura mensal
        </div>
      </div>
    </div>
  );
}

export function TrustAndFaq() {
  const faq = [
    {
      q: 'Quando recebo minha LovePage?',
      a: 'Depois que o Mercado Pago confirma o PIX, o link e o QR Code do presente são liberados automaticamente.',
    },
    {
      q: 'Por que o CPF é solicitado?',
      a: 'Ele é solicitado somente na etapa de pagamento para gerar o PIX com o provedor. O CPF não aparece no presente público.',
    },
    {
      q: 'Quantas fotos posso colocar?',
      a: 'Você pode enviar até 10 fotos. Elas são otimizadas no navegador antes do envio para deixar a experiência mais leve.',
    },
    {
      q: 'A música toca sozinha?',
      a: 'A música usa o player do Spotify. Alguns navegadores bloqueiam reprodução automática, então a pessoa pode precisar tocar no play.',
    },
    {
      q: 'Posso corrigir antes de pagar?',
      a: 'Sim. Enquanto o pagamento não for aprovado, você pode cancelar o PIX pendente, ajustar os dados e gerar outro.',
    },
    {
      q: 'Qualquer pessoa consegue encontrar a página?',
      a: 'As páginas de presente não são configuradas para aparecer em mecanismos de busca. Mesmo assim, qualquer pessoa que tiver o link consegue acessá-la.',
    },
    {
      q: 'Posso editar depois que o pagamento for aprovado?',
      a: 'Na versão atual, a edição automática depois da entrega ainda não está disponível. Por isso, revise a prévia antes de finalizar o pagamento.',
    },
  ];

  return (
    <>
      <section className="border-t border-slate-800 bg-slate-900/40 px-4 sm:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-[0.2em]">Compra sem surpresa</p>
            <h2 className="text-3xl md:text-4xl font-black mt-2">Você vê o presente antes de pagar</h2>
            <p className="text-slate-400 mt-3">
              Personalize, confira a prévia e só depois siga para o PIX.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <Smartphone className="text-rose-400" size={20} />
              <b className="block mt-3">Prévia em tempo real</b>
              <p className="text-xs text-slate-500 mt-1">Veja no celular simulado como o presente está ficando.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <ShieldCheck className="text-emerald-400" size={20} />
              <b className="block mt-3">PIX via Mercado Pago</b>
              <p className="text-xs text-slate-500 mt-1">A cobrança é processada pelo provedor de pagamento.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <Lock className="text-cyan-300" size={20} />
              <b className="block mt-3">Dados separados do presente</b>
              <p className="text-xs text-slate-500 mt-1">CPF e e-mail não são exibidos na página que você compartilha.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <Zap className="text-amber-300" size={20} />
              <b className="block mt-3">Entrega automática</b>
              <p className="text-xs text-slate-500 mt-1">Quando o pagamento é aprovado, o link final é liberado automaticamente.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-slate-800 bg-slate-950 px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-[0.2em]">Dúvidas rápidas</p>
            <h2 className="text-3xl md:text-4xl font-black mt-2">Perguntas frequentes</h2>
          </div>

          <div className="space-y-3">
            {faq.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
                <summary className="list-none cursor-pointer px-5 py-4 font-semibold flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-slate-500 group-open:rotate-45 transition text-xl leading-none">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-slate-400">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
