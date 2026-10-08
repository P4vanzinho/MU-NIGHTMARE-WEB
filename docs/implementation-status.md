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
