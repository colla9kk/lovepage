# LovePage

Página romântica personalizada com pagamento único de R$ 19,90 via PIX. Frontend Next.js; backend Express/Prisma; SQLite local e PostgreSQL em produção.

## Antes de usar pagamentos reais

A credencial anteriormente presente no código público deve ser **revogada no Mercado Pago e substituída**. Remover do código não revoga a credencial nem apaga o histórico Git. Nunca use a credencial antiga. Configure os segredos somente no backend/host; não os envie ao GitHub, frontend ou logs.

## Desenvolvimento local

Requisito: Node.js 22 LTS (ou compatível) e npm. Execute comandos da raiz, salvo indicação contrária.

```sh
npm --prefix backend ci --ignore-scripts
npm --prefix frontend ci --ignore-scripts
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm --prefix backend run db:generate
npm --prefix backend run db:migrate
```

Preencha as variáveis em `backend/.env`. O comando de migração cria um arquivo SQLite vazio quando necessário e aplica as migrações. Para um banco **existente com a tabela Page e sem histórico Prisma**, faça backup antes e registre a migração inicial como já aplicada, dentro de `backend`:

```sh
npx prisma migrate resolve --applied 202609200001_baseline
npm run db:migrate
```

Não use `migrate reset` para atualizar um banco com dados. A migração de pedidos preserva as páginas antigas, que ficam com `orderId` nulo.

Em dois terminais:

```sh
npm run dev:backend
npm run dev:frontend
```

Abra `http://localhost:3000`.

## Variáveis

| Local | Nome | Uso |
| --- | --- | --- |
| Backend | `DATABASE_URL` | SQLite: `file:./dev.db`; PostgreSQL: conexão fornecida pelo banco, com TLS conforme o provedor |
| Backend | `MERCADO_PAGO_ACCESS_TOKEN` | Nova credencial privada do recebedor |
| Backend | `MERCADO_PAGO_COLLECTOR_ID` | ID numérico da conta recebedora, não o ID da aplicação |
| Backend | `MERCADO_PAGO_WEBHOOK_SECRET` | Segredo de assinatura configurado no painel de Webhooks; obrigatório em produção |
| Backend | `MERCADO_PAGO_NOTIFICATION_URL` | `https://seu-backend/api/webhooks/mercadopago`; configure também os eventos de pagamento no painel |
| Backend | `FRONTEND_URL` | Origem pública do frontend; HTTPS em produção; usada no CORS e QR Code |
| Backend | `PORT` | Porta HTTP, padrão 5000 |
| Backend | `TRUST_PROXY_HOPS` | Quantidade exata de proxies confiáveis entre cliente e backend; 0 no acesso direto |
| Frontend | `NEXT_PUBLIC_API_URL` | Origem do backend; precisa estar definida **antes do build** |

Não há modo de aprovação falsa no servidor de produção. Os testes injetam um gateway simulado somente no processo de teste. O formulário coleta e-mail e CPF do comprador; não usa dados fictícios para contornar recusas do provedor. A validação dos dígitos do CPF não verifica titularidade.

## Fluxo e recuperação

1. O navegador gera um UUID de pedido e uma chave aleatória de recuperação, salva somente esses dois valores no armazenamento local e envia o formulário ao backend.
2. O backend valida o conteúdo e persiste pedido, dados do presente e hash da chave **antes** de solicitar a cobrança. O valor de 1990 centavos é definido no servidor.
3. A criação no Mercado Pago usa o UUID persistido como chave de idempotência. Repetir uma requisição recupera a mesma cobrança; os dados do pedido já criado não mudam.
4. A consulta autenticada ao pedido verifica pagamento, valor, moeda BRL, recebedor, método PIX e referência do pedido. A página possui vínculo único com o pedido.
5. A interface só anuncia entrega quando recebe a URL e o QR Code de uma página salva. Falhas temporárias são tentadas novamente, sem criar outra cobrança.
6. Webhooks com assinatura HMAC válida e uma reconciliação a cada 30 segundos permitem entregar mesmo com o navegador fechado. O backend consulta o provedor; não aceita aprovação enviada pelo navegador ou corpo do webhook.

A recuperação automática funciona no **mesmo navegador e origem**, desde que o armazenamento não seja apagado. Não há recuperação por e-mail implementada. O presente é público para quem possui o link. Nome, foto e mensagem continuam no banco; CPF e e-mail do pedido são apagados após entrega ou recusa definitiva na criação. Pedidos pendentes ainda contêm dados necessários ao pagamento; o operador deve definir e executar uma política de retenção antes de ampliar a operação.

O polling é sequencial, com intervalo de 3 segundos, timeout e interrupção em estados finais. Falhas de rede preservam a chave de recuperação. Só é possível iniciar outro presente após entrega ou encerramento do pagamento. A imagem aceita tem até 5 MiB, em JPEG/PNG/WebP; a API aceita JSON de até 8 MiB para acomodar Base64. QR Code entregue em PNG de 1200 px.

### Rotas

- `POST /api/checkout/pix`: corpo com `orderId`, `email`, `cpf`, `nomeCasal`, `dataInicio`, `mensagem`, `fotoUrl`, `spotifyTrackId`; cabeçalho `Authorization: Bearer <chave de recuperação>`.
- `GET /api/checkout/orders/:orderId`: mesmo cabeçalho; retorna status, PIX, dados do presente e resultado quando entregue.
- `POST /api/webhooks/mercadopago`: assinatura `x-signature`, `x-request-id` e ID em `data.id` na query; configure notificações de pagamentos da aplicação.
- `GET /api/pages/:slug`: somente dados públicos da página.
- `GET /health`: verifica conexão com o banco.
- As antigas rotas de criação direta de páginas e consulta pública de paymentId retornam HTTP 410.

## Testes e builds

```sh
npm --prefix backend run db:generate
npm --prefix backend run build
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

Defina `NEXT_PUBLIC_API_URL` para o build do frontend. Os testes usam SQLite temporário e não cobram dinheiro. Cobrem publicação sem pagamento, acesso com chave incorreta, duplicidade, dados financeiros divergentes, timeout após emissão, falha de gravação após aprovação, cancelamento, webhook e validação de entrada. O CI também prepara banco PostgreSQL e verifica migrations e build.

## Publicação

### Frontend

Configure o projeto na Vercel ou Netlify com diretório raiz `frontend`, instalação `npm ci --ignore-scripts`, build `npm run build` e `NEXT_PUBLIC_API_URL=https://seu-backend`. Reconstrua o frontend se mudar essa URL.

### Backend e PostgreSQL

Use um processo Node persistente em Render/Railway/Fly.io, com diretório raiz `backend` e as variáveis acima. A reconciliação periódica requer processo ativo; não dependa dela em hosts que suspendem o serviço. Configure o webhook para recuperação independente do navegador.

Build:

```sh
npm ci --ignore-scripts
npm run db:generate:postgres
npm run build
```

Com `DATABASE_URL` apontando para o PostgreSQL, execute no release/start:

```sh
npm run db:migrate:postgres
npm start
```

Use uma conexão apropriada para migrações, conforme o banco contratado. Health check: `/health`. Alternativamente, há um `backend/Dockerfile` com esses passos. Não gere o client SQLite depois de gerar o PostgreSQL na mesma instalação de produção.

A aplicação inclui limitação de requisições por processo; múltiplas réplicas precisam de um limitador compartilhado para manter limites globais. Backups do banco devem ser configurados no provedor. Fotos continuam em Base64 no banco nesta versão.

### Transferir um SQLite existente para PostgreSQL

Pare gravações durante a transferência e faça backup. O procedimento preserva IDs, slugs e pedidos; só permite importar em destino vazio e usa transação. Não apague o SQLite até conferir os dados e links no destino.

Dentro de `backend`:

```sh
python scripts/export-sqlite.py prisma/dev.db backup.export.json
# Configure DATABASE_URL com o PostgreSQL de destino.
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:import:postgres -- backup.export.json
```

O arquivo exportado contém dados privados: mantenha-o protegido, não faça commit e remova a cópia temporária após verificar a migração. Para voltar ao desenvolvimento SQLite, restaure `DATABASE_URL` e execute `npm run db:generate`.

## Validação real antes de lançar

Após configurar uma nova credencial, conta recebedora e webhook, faça uma compra controlada com os dados reais do comprador. Confirme o valor no aplicativo bancário, pague manualmente e confira a página pública e o PNG. Repita a consulta e recarregue o navegador para confirmar que a mesma página é recuperada. Verifique também as notificações no painel do provedor. Nenhuma cobrança real é feita pelos testes automatizados.

Esta alteração prepara o código e a migração; não provisiona contas, não revoga credenciais no painel e não transfere um banco ao qual o projeto não tem acesso.
