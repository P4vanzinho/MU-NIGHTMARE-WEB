# Estado da implementação

Atualizado em 08/10/2026.

## Fase 1 — primeiro fluxo público persistido

Estado: validada localmente.

Entregue:

- Aplicação nova criada com React + TanStack Start.
- Branches `main`, `staging` e `development` criadas no repositório remoto.
- Primeiro percurso SSR público com header, hero, status do servidor, rates, notícias e footer.
- Função de servidor tipada para montar o snapshot da página.
- Simulador OpenMU isolado em adaptador próprio, com teste de contrato.
- Schema inicial PostgreSQL/Drizzle e configuração de migrations preparados.
- Docker Compose com PostgreSQL 17.
- Biome configurado para formatação e lint.
- Typecheck, Biome, teste unitário e build SSR verificados.

Pendências desta fase:

- O Docker não está disponível neste ambiente WSL (`docker` não encontrado); o container PostgreSQL não foi iniciado nem validado aqui.
- O snapshot agora lê a configuração persistida no PostgreSQL através do Drizzle.
- A inicialização cria somente a configuração padrão ausente; não substitui dados existentes.
- O simulador OpenMU continua separado e explícito; ele ainda não representa a integração real com o jogo.

Evidências verificadas:

```text
npm run typecheck  -> passou
npm run check      -> passou
npm run test       -> 1 teste, passou
npm run build      -> build client e SSR, passou
SSR localhost     -> conteúdo do servidor e notícias renderizado
Docker/PostgreSQL -> container iniciado e migration aplicada
```

Próximo passo: criar a primeira tela administrativa para editar as configurações persistidas, mantendo o modo simulado do OpenMU.

## Fase 2 — cadastro e confirmação de e-mail

Estado: validada localmente.

Entregue:

- Better Auth conectado ao PostgreSQL por Drizzle.
- Schema oficial de `user`, `session`, `account` e `verification` gerado e migrado.
- Cadastro de player em `/register`, com validação básica e aceite dos termos.
- Endpoint catch-all `/api/auth/*` montado no TanStack Start.
- E-mail de confirmação capturado no outbox local, sem envio externo.
- Página local `/dev/email-outbox` para abrir o link de confirmação.
- Confirmação processada pelo Better Auth e verificada no banco.

Evidências verificadas:

```text
POST /api/auth/sign-up/email       -> 200, usuário criado como não verificado
outbox local                       -> URL de confirmação capturada
GET URL capturada                  -> 302 para /verify-email
PostgreSQL                         -> email_verified = true
```

Pendências que permanecem para fases seguintes:

- Integração da identidade do jogador com a conta OpenMU e validação de username/PIN.
- Login, logout, expiração e revogação de sessão da Fase 3.
- O outbox de e-mail é ferramenta de desenvolvimento local e não envia mensagens reais.

## Fase 3 — sessão player e acesso admin

Estado: validada localmente.

Entregue:

- Login e logout com sessão HttpOnly do Better Auth.
- Rota `/account` protegida por sessão no servidor.
- Rota `/admin` protegida por role `admin` no servidor.
- Role padrão `player` e plugin administrativo do Better Auth.
- Script `npm run admin:create` para criar múltiplos admins com credenciais fornecidas por ambiente.
- Schema e migration para role, bloqueio e impersonação de sessão.
- QA Playwright cobrindo bloqueio de rotas privadas, cadastro, confirmação, login e logout.

Evidências verificadas:

```text
npm run admin:create             -> admin criado e verificado no PostgreSQL
Playwright player flow           -> passou
Playwright admin flow            -> disponível com E2E_ADMIN_EMAIL/PASSWORD
player -> /admin                 -> redireciona para /login
```

O script de admin não possui credenciais padrão; o ambiente deve sempre fornecer `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

## Fase 4 — recuperação e troca de senha

Estado: validada localmente.

Entregue:

- Solicitação de recuperação em `/forgot-password` com resposta genérica para não enumerar contas.
- Link de recuperação capturado no outbox local.
- Nova senha em `/reset-password` com token de uso único do Better Auth.
- Revogação das outras sessões ao redefinir ou alterar a senha.
- Troca de senha dentro de `/account`, exigindo a senha atual.
- Testes para token inválido e confirmação de senha divergente no formulário.

QA Playwright executado:

```text
player flow                    -> cadastro, confirmação, login, troca de senha e logout
admin flow                     -> login e acesso ao painel
password recovery flow         -> solicitação, link local, redefinição e novo login
resultado                      -> 3 testes passaram
```

O e-mail continua sendo capturado apenas localmente. Integração com provedor externo e recuperação compatível com a autoridade de credenciais OpenMU permanecem pendentes.

## Fase 5 — administração de contas

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Lista administrativa de contas com papel, verificação, estado e motivo do bloqueio.
- Bloqueio e desbloqueio protegidos por sessão `admin` no servidor.
- Bloqueio encerra as sessões da conta e afeta somente o portal; não representa banimento no OpenMU.
- Último administrador ativo não pode ser bloqueado; o próprio administrador também não pode bloquear a própria conta.
- Auditoria persistida com ator, alvo, ação, motivo e data.
- Migration `0003_petite_midnight.sql` criada para a tabela de auditoria.
- Playwright preparado para verificar bloqueio, tentativa de login e desbloqueio.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> 1 teste, passou
npm run build               -> build client e SSR, passou
Playwright                  -> bloqueado: Docker/PostgreSQL indisponível nesta sessão
```

O fluxo de QA precisa ser repetido com PostgreSQL disponível antes de marcar a fase como validada. A gestão continua restrita à conta do portal e não altera a autoridade de identidade do OpenMU.

## Fase 6 — publicação e leitura de notícias

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Tabela `news_post` com slug único, resumo, conteúdo, categoria, capa, autoria e datas.
- Feed público em `/news` e artigo permanente em `/news/:slug`.
- Painel `/admin/news` para publicar, salvar rascunho e editar notícias preservando o ID.
- Slug derivado do título com resolução de colisões.
- Conteúdo renderizado como texto, sem execução de HTML arbitrário.
- Playwright preparado para publicar uma notícia e ler o artigo público.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> 1 teste, passou
npm run build               -> build client e SSR, passou
Playwright                  -> aguardando PostgreSQL/Docker local
```

Migration criada: `0004_long_overlord.sql`. A leitura e publicação precisam ser repetidas com o banco disponível antes de marcar a fase como validada.

## Fase 7 — interações e moderação do blog

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Curtidas idempotentes por conta e notícia, protegidas por índice único.
- Comentários vinculados à conta e à notícia, com remoção pelo próprio autor.
- Painel `/admin/comments` para ocultar e restaurar comentários.
- Auditoria administrativa das decisões de moderação.
- Teste Playwright preparado para curtir, comentar, ocultar e restaurar uma interação.
- Migrations `0005_furry_bill_hollister.sql` criada para as tabelas de interação.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> passou
npm run build               -> build client e SSR, passou
Playwright                  -> aguardando PostgreSQL/Docker local
```

## Fase 8 — envio e acompanhamento de reports

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Formulário autenticado em `/bugreport` com título, passos e impacto.
- Protocolo único persistido para cada report.
- Lista de reports do próprio player, sem consulta cruzada entre contas.
- Estados iniciais preparados para a análise administrativa da Fase 9.
- Migration `0006_last_black_knight.sql` criada para `bug_report`.
- Playwright preparado para envio e acompanhamento do protocolo.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> passou
npm run build               -> build client e SSR, passou
Playwright                  -> aguardando PostgreSQL/Docker local
```

## Fase 9 — análise administrativa e decisão de recompensa

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Painel `/admin/reports` com consulta administrativa dos reports.
- Classificação de severidade e ciclo de status (`in_review`, `resolved`, `closed`).
- Registro de análise administrativa e justificativa da decisão.
- Decisão de recompensa (`pending`, `approved`, `denied`) persistida sem entrega de saldo.
- Player acompanha status, severidade, análise e decisão apenas dos próprios reports.
- Auditoria da revisão administrativa vinculada ao autor do report.
- Migration `0007_curly_payback.sql` criada para os campos de análise.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> passou
npm run build               -> build client e SSR, passou
Playwright                  -> aguardando PostgreSQL/Docker local
```

A entrega efetiva de Nightmare Coins ou qualquer benefício continua deliberadamente fora desta fase.

## Fase 10 — ranking e perfil público autorizado

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Ranking simulado persistido com seed determinístico e ordenação estável por pontuação, nível e nome.
- Busca global por jogador ou classe sem limitar a consulta aos primeiros registros.
- Destaques visuais para as cinco primeiras posições sem alterar a posição global.
- Perfil público mínimo em `/ranking/:slug`.
- Visibilidade pública explícita no modelo; campos privados não são expostos.
- Migration `0008_yellow_lila_cheney.sql` criada para o ranking simulado.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> passou
npm run build               -> build client e SSR, passou
Playwright                  -> aguardando PostgreSQL/Docker local
```

A edição de visibilidade e a substituição pelo ranking real do OpenMU permanecem pendentes das fases de integração.

## Fase 11 — agenda e contador de eventos

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Agenda simulada persistida com três eventos e horários UTC.
- Página `/events` com duração, multiplicador e programação de cada evento.
- Aviso explícito de que a agenda não confirma execução real no jogo.
- Migration `0009_pink_scarlet_witch.sql` criada junto com os dados simulados da Fase 12.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> passou
npm run build               -> build client e SSR, passou
Playwright                  -> aguardando PostgreSQL/Docker local
```

## Fase 12 — conta, personagens e cofres somente leitura

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Personagens, itens do cofre, Nightmare Coins e VIP simulados por conta.
- Dados criados sob demanda para o player autenticado e protegidos por `ownerId` no backend.
- Exibição somente leitura na área `/account`.
- Nenhuma alteração de personagem, transferência, débito ou cobrança foi criada.
- Falhas de consulta não são convertidas silenciosamente em saldos zerados.

Validação local:

```text
npm run typecheck           -> passou
npm run check               -> passou
npm run test                -> passou
npm run build               -> build client e SSR, passou
Playwright                  -> aguardando PostgreSQL/Docker local
```

A integração desses dados com o OpenMU real continua pendente da Fase 16.

## Fase 13 — campanhas gerenciáveis da home

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Campanhas persistidas com título, descrição, CTA, rota interna, posição e status ativo.
- Seed idempotente de campanhas padrão na home.
- Editor administrativo em `/admin/campaigns`.
- Cards de campanha renderizados na home sem acoplar conteúdo à estrutura visual.
- Migration `0010_busy_vulture.sql` criada.

Não foram adicionados links de compra, moeda ou marketplace; esses fluxos seguem fora do escopo até a integração do jogo.

## Fase 14 — busca pública

Estado: implementada; QA de integração aguardando PostgreSQL local.

Entregue:

- Busca em `/search` por notícias publicadas e perfis públicos simulados.
- Resultados levam diretamente ao conteúdo público correspondente.
- Consultas não incluem contas privadas, reports ou dados de autenticação.
- Link de busca incluído na navegação global.

## Fase 15 — contrato explícito de integração OpenMU

Estado: contrato preparado; integração real bloqueada pela ausência de uma instalação OpenMU acessível.

Entregue:

- Interface pública `OpenMuPublicGateway` e modelo de saúde/capacidades.
- Seleção explícita por `OPENMU_MODE=simulated|real`.
- Adaptador simulado retorna capacidades locais conhecidas.
- Adaptador real falha de forma explícita com `OpenMuUnavailableError`; não há fallback silencioso.
- Página `/server` exibe modo, conexão e capacidades.

Pendente: implementar o adaptador real quando endpoints, credenciais e ambiente OpenMU forem fornecidos.

## Fase 16 — fronteira de dados privados do jogador

Estado: preparado apenas no modo simulado.

Personagens, cofre, carteira, ranking e eventos continuam sendo lidos de adaptadores locais. Nenhuma mutação de moeda, item ou personagem foi liberada. A troca pelo OpenMU real exige contrato de identidade, autorização por conta e testes de ownership antes de qualquer escrita.

## Fase 17 — operação e observabilidade local

Estado: base operacional implementada; validação de infraestrutura pendente.

Entregue:

- Registro persistente de operações em `operation_log`.
- Painel administrativo `/admin/operations` com saúde do OpenMU e últimas operações.
- Links do painel administrativo para campanhas e saúde operacional.
- Migration `0010_busy_vulture.sql` inclui a tabela operacional.

Pendente e documentado para a próxima etapa:

- Subir PostgreSQL via Docker e aplicar migrations em ambiente local.
- Exercitar restauração, reinício e carga concorrente com Playwright e banco disponível.
- Conectar o adaptador real e registrar erros/latências das chamadas OpenMU.

## Fase 18 — transferência de itens simulada

Estado: implementada no simulador; integração OpenMU real deliberadamente bloqueada.

Entregue:

- Transferência autenticada em `/account/transfers` usando e-mail do destinatário, item e quantidade.
- Atualização atômica do cofre de origem e destino em uma transação Drizzle.
- Protocolo persistido em `simulated_item_transfer` para rastreabilidade.
- Validação de titularidade, quantidade disponível, destinatário e prevenção de envio para a própria conta.
- Migration `0011_tiresome_malcolm_colcord.sql` aplicada no PostgreSQL local.
- Nenhuma escrita é enviada ao OpenMU.

Pendente para a evolução do simulador: idempotência explícita por chave de requisição, tela administrativa de recuperação e ensaios concorrentes automatizados. A integração real só pode ser habilitada quando o contrato de inventário e reserva do OpenMU estiver disponível.

## Fase 19 — catálogo e condições comerciais

Estado: implementada em modo local; sem cobrança real.

Entregue:

- Catálogo persistido com preço, moeda, benefício, elegibilidade e status ativo.
- Seed de produtos locais somente para demonstração do fluxo.
- Administração em `/admin/shop` para criar e editar ofertas.
- Loja autenticada em `/shop` com aviso explícito de simulação.
- Migration `0012_lying_red_shift.sql` criada e aplicada.

## Fase 20 — pedido e pagamento exclusivamente simulados

Estado: implementada em modo local; nenhum pagamento real é aceito.

Entregue:

- Criação de pedido persistido com protocolo, preço e moeda congelados no momento da compra.
- Evento de pagamento simulado separado da criação do pedido.
- Eventos duplicados ignorados por `eventId` único.
- Estados terminais impedem transições posteriores fora de ordem.
- Histórico de pedidos do player exibido na própria loja.

Pendente: definir política final de expiração/cancelamento e conectar um provedor de pagamento somente em uma fase posterior aprovada. A entrega abaixo continua restrita ao simulador.

## Fase 21 — entrega simulada de benefícios

Estado: implementada no simulador; integração com o OpenMU real continua bloqueada.

Entregue:

- Pagamento simulado confirmado cria um registro em `simulated_benefit_grant` com referência única do pedido.
- Pacotes de Nightmare Coins incrementam a carteira do comprador na mesma transação do pedido.
- Reenvio do mesmo evento ou confirmação duplicada não gera um segundo crédito.
- O fluxo E2E cobre cadastro, confirmação de e-mail, compra e validação do saldo inicial mais o benefício.
- Migration `0013_cute_sunspot.sql` criada e aplicada no PostgreSQL local.

Limitações documentadas:

- A carteira ainda é uma projeção local; nenhuma escrita é enviada ao OpenMU.
- Benefícios VIP são registrados no ledger, mas ainda não alteram regras reais de acesso ou personagem.
- Mercado entre jogadores, PIX/Mercado Pago, reserva configurável e reconciliação externa continuam fora do escopo.

A Fase 21 foi endurecida com painel administrativo `/admin/grants` para
inspecionar concessões e repetir estados pendentes ou falhos. No simulador,
Nightmare Coins são aditivas e VIP mantém o maior nível concedido; validade,
renovação e estorno dependem do contrato real e continuam documentados como
pendências.

## Fase 22 — anúncios e descoberta do marketplace

Estado: implementada no simulador; sem moeda real e sem escrita no OpenMU.

Entregue:

- Player anuncia uma unidade de item do cofre com preço em Nightmare Coins.
- A unidade é retirada do cofre durante a criação do anúncio e fica reservada.
- Busca por nome, filtros de preço, paginação e consulta dos próprios anúncios.
- Cancelamento só funciona para anúncio ativo e devolve a unidade uma única vez.
- Itens de outra conta, indisponíveis ou anúncios já finalizados são recusados.
- Migration `0014_yielding_ultragirl.sql` criada e aplicada no PostgreSQL local.

Regra local adotada: a Fase 22 aceita somente `NC` inteira como unidade de
preço. Joias, múltiplas moedas e venda em reais ficam bloqueadas até aprovação
de regras comerciais e integração do jogo.

## Fase 23 — compra e ofertas em Nightmare Coins simulados

Estado: implementada no simulador; sem integração OpenMU real.

Entregue:

- Compra direta faz débito do comprador, crédito do vendedor e entrega do item
  em uma transação única.
- Dois compradores não conseguem concluir o mesmo anúncio; o primeiro estado
  ativo convertido em vendido vence.
- Compra própria, saldo insuficiente e moeda incompatível são recusados.
- Jogadores podem enviar ofertas em NC; o vendedor pode aceitar uma oferta.
- Aceite liquida a oferta, rejeita as demais pendentes e registra a troca única.
- O fluxo E2E cobre anúncio, compra direta e negociação por oferta.

Pendências: validade/expiração automática de ofertas, comissão, arredondamento,
estorno e integração de inventário/saldo real do OpenMU.

## Decisões de produto para a Fase 24

- A plataforma retém 20% do valor bruto da venda; o vendedor tem direito a
  80%, antes de eventuais taxas do provedor de pagamento, cuja incidência
  ainda será definida.
- Uma venda em moeda real reserva o item quando o comprador inicia uma
  tentativa de pagamento válida, e não ao apenas abrir o anúncio.
- A reserva identifica o comprador e tem prazo configurável; o primeiro valor
  de teste será 15 minutos.
- Enquanto a reserva estiver ativa, o anúncio não pode ser iniciado por outro
  comprador.
- Pagamento confirmado liquida a venda; falha, cancelamento ou expiração
  liberam o item novamente.
- Uma confirmação recebida depois da expiração não entrega o item
  automaticamente. Ela gera um estado de confirmação tardia para estorno ou
  decisão administrativa.
- Essa regra será simulada localmente antes de qualquer integração com Mercado
  Pago ou OpenMU.
- Após a confirmação de entrega pelo OpenMU, a contestação ficará aberta por
  24 horas inicialmente. O prazo será configurável e, durante a contestação,
  o valor continuará retido.
