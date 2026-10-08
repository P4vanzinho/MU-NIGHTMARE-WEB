# Estado da implementação

Atualizado em 08/10/2026.

## Fase 1 — primeiro fluxo público persistido

Estado: parcialmente validada localmente.

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
- O primeiro snapshot ainda lê configurações de notícia do armazenamento local do simulador para permitir a demonstração sem um banco disponível. Isso é explicitamente temporário e não é fallback silencioso da integração real.
- A leitura e gravação do snapshot via Drizzle/PostgreSQL será concluída assim que o Docker estiver disponível.
- Migrações e conexão real ainda não foram executadas.

Evidências verificadas:

```text
npm run typecheck  -> passou
npm run check      -> passou
npm run test       -> 1 teste, passou
npm run build      -> build client e SSR, passou
SSR localhost     -> conteúdo do servidor e notícias renderizado
```

Próximo passo: subir PostgreSQL via `docker compose up -d postgres`, aplicar a migration Drizzle e trocar o repositório temporário de configurações pelo repositório PostgreSQL, mantendo o modo simulado do OpenMU.
