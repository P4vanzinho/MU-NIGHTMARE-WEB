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
