import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | LovePage',
  description: 'Condições de uso do serviço de presentes digitais LovePage.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 px-5 py-12">
      <article className="max-w-3xl mx-auto">
        <a href="/" className="text-rose-400 hover:text-rose-300 text-sm">← Voltar para a LovePage</a>
        <h1 className="text-4xl font-black text-white mt-6">Termos de Uso</h1>
        <p className="text-slate-500 text-sm mt-2">Última atualização: 21 de setembro de 2026.</p>

        <div className="mt-9 space-y-7 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. O serviço</h2>
            <p>
              A LovePage permite montar um presente digital personalizado com fotos, textos, música e outros
              elementos disponíveis no modelo escolhido. O usuário visualiza uma prévia antes de seguir para o pagamento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Pagamento e entrega</h2>
            <p>
              O valor exibido antes da cobrança corresponde a um pagamento único via PIX. O presente é liberado
              depois que o provedor confirma a aprovação do pagamento. O tempo de confirmação pode depender do
              próprio provedor e da instituição financeira utilizada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Revisão do conteúdo</h2>
            <p>
              Antes de pagar, revise nomes, datas, fotos, mensagem, música e o modelo escolhido. Na versão atual,
              a edição automática do presente depois da entrega não está disponível.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Conteúdo enviado</h2>
            <p>
              Você deve ter autorização para usar as fotos, textos e demais materiais que enviar. Não utilize o
              serviço para conteúdo ilegal, abusivo, que viole direitos de terceiros ou que exponha informações
              pessoais de outra pessoa sem autorização.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">5. Acesso ao presente</h2>
            <p>
              O presente é acessível por link. Embora as páginas sejam configuradas para não serem indexadas por
              mecanismos de busca, o link pode ser repassado por quem o receber. Não trate o endereço como um
              ambiente privado ou protegido por senha.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">6. Spotify e serviços externos</h2>
            <p>
              A reprodução de músicas depende do player e das regras do Spotify e do navegador. Não é possível
              garantir reprodução automática ou um trecho específico de uma faixa. Pagamentos e outras integrações
              também podem depender da disponibilidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">7. Disponibilidade</h2>
            <p>
              A LovePage busca manter os presentes acessíveis, mas manutenção, falhas técnicas, mudanças em
              serviços de terceiros ou eventos fora do controle da operação podem causar indisponibilidade temporária.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">8. Direitos do consumidor</h2>
            <p>
              Estes termos não excluem direitos obrigatórios previstos na legislação aplicável. Em caso de problema
              com uma compra, utilize o canal de atendimento da LovePage para que o caso seja analisado.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
