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
