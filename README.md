# MU Nightmare Web

Portal web do MU Nightmare, construído do zero em TypeScript com TanStack Start.

O diretório `mu-nightmare` ao lado deste repositório é somente a referência visual do protótipo. Esta aplicação possui implementação, contratos, banco e integrações próprios.

## Desenvolvimento local

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run dev
```

O primeiro fluxo público usa o simulador explícito do OpenMU (`OPENMU_MODE=simulated`). O PostgreSQL é provisionado pelo Docker Compose; as migrations Drizzle serão aplicadas nas próximas etapas de persistência.

Comandos disponíveis:

```bash
npm run typecheck
npm run check
npm run test
npm run build
```

O trabalho ativo acontece na branch `development`. `staging` e `main` recebem mudanças validadas conforme o plano. Consulte [`plans/plano-implementacao-mu-nightmare.md`](plans/plano-implementacao-mu-nightmare.md) para as fases.
