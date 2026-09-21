import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | LovePage',
  description: 'Como a LovePage utiliza dados para criar presentes digitais e processar pagamentos.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 px-5 py-12">
      <article className="max-w-3xl mx-auto">
        <a href="/" className="text-rose-400 hover:text-rose-300 text-sm">← Voltar para a LovePage</a>
        <h1 className="text-4xl font-black text-white mt-6">Política de Privacidade</h1>
        <p className="text-slate-500 text-sm mt-2">Última atualização: 21 de setembro de 2026.</p>

        <div className="mt-9 space-y-7 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Dados usados para criar o presente</h2>
            <p>
              A LovePage recebe as informações que você escolhe inserir no presente, como nomes, mensagem, fotos,
              data especial, música, tipo de modelo e outros textos personalizados. Depois da aprovação do pagamento,
              essas informações compõem a página pública acessível por quem possuir o link.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Dados usados no pagamento</h2>
            <p>
              E-mail e CPF são solicitados somente na etapa de pagamento para processar a cobrança via PIX.
              Esses dados não são exibidos na página pública do presente. O fluxo também envia ao provedor de
              pagamento os dados necessários para a transação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Retenção</h2>
            <p>
              Nos fluxos atuais, CPF e e-mail são apagados do pedido após a aprovação e entrega do presente,
              após cancelamento e em determinadas recusas definitivas. Pedidos ainda pendentes podem manter esses
              dados enquanto o pagamento precisa ser acompanhado. O conteúdo do presente permanece armazenado
              para que o link entregue continue funcionando.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Métricas de uso</h2>
            <p>
              A LovePage registra eventos técnicos e de funil, como visita à página inicial, escolha de modelo,
              avanço para pagamento, criação do PIX, abertura do presente e compartilhamento. Essas métricas não
              incluem CPF ou e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">5. Armazenamento no navegador</h2>
            <p>
              O navegador pode guardar localmente um identificador do pedido e uma chave de recuperação para que
              seja possível continuar acompanhando uma compra no mesmo dispositivo. CPF, e-mail e fotos não são
              salvos nesse armazenamento local pelo fluxo de recuperação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">6. Compartilhamento e página pública</h2>
            <p>
              O presente não é configurado para indexação por mecanismos de busca, mas qualquer pessoa que obtiver
              o link pode abrir a página. Portanto, evite inserir conteúdo que você não queira compartilhar com
              quem receber esse link.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">7. Serviços de terceiros</h2>
            <p>
              A operação pode envolver serviços de hospedagem, banco de dados, Mercado Pago para pagamento e
              Spotify quando uma música é incluída. Esses serviços tratam informações de acordo com suas próprias
              políticas e com os dados necessários ao funcionamento de cada integração.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">8. Solicitações sobre dados</h2>
            <p>
              Para solicitar esclarecimentos, correção ou exclusão de informações quando aplicável, utilize o
              canal de atendimento da LovePage pelo qual você realizou o contato ou recebeu suporte.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
