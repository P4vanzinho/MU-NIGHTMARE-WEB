# Plano de implementação — MU Nightmare

> Origem: [PRD MU Nightmare](./prd-mu-nightmare.md). Estado: plano consolidado após concordância com a direção arquitetural e solicitação de escrita. Escopo exclusivamente local; a escrita do plano não inicia implementação.

## Architectural decisions

- **Construção do zero:** projeto independente; protótipo serve somente como referência visual e de organização das páginas. Não transplantar implementação, reducers, autenticação ou modelo de dados; o site antigo é evidência de integração, não aplicação-base.
- **Stack acordada:** TypeScript ponta a ponta; React + TanStack Start (TanStack Router, Vite e SSR), Better Auth, PostgreSQL próprio do portal e Drizzle para schema, consultas, transações e migrations. Tailwind + shadcn/ui atendem à interface componentizada solicitada. Selecionar versões compatíveis e fixá-las na primeira fase, com runtime Node suportado pelos pacotes escolhidos.
- **Comunicação interna:** funções de servidor do Start encaminham chamadas tipadas para serviços de domínio. Rotas HTTP atendem autenticação e integrações que exijam endpoints, incluindo futuros webhooks. Toda entrada precisa de validação runtime, autenticação e autorização no servidor; tipagem não substitui esses controles.
- **Motivação:** site público, área player e administração são os consumidores conhecidos, com desenvolvimento e execução coordenados. Start já fornece SSR, funções de servidor e rotas HTTP; não adicionar Nest, Hono ou tRPC inicialmente. API independente pode ser reconsiderada com outros consumidores reais, implantação independente ou necessidade de rede/escala comprovada.
- **Renderização:** SSR para páginas públicas pertinentes e carregamento privado sem cache compartilhado entre contas. Validar build, hidratação, runtime e estabilidade das versões escolhidas no primeiro percurso completo; registrar eventuais limitações do Start antes de expandir as fases.
- **Organização:** monólito modular do portal, separado do processo do jogo; interfaces de identidade, leituras e recursos OpenMU substituíveis entre simulador e instalação real. E-mail e pagamento são adaptadores distintos. Não introduzir microserviços sem necessidade demonstrada.
- **Rotas:** preservar /, /server, /download, /register, /login, /changepass, /account, /stats, /events, /news, /news/:slug, /bugreport, /community, /rules e /search. Novas: /verify-email, /forgot-password, /reset-password e /admin. Posteriores: /shop, /donation e /marketplace. /api exclusivo do backend; fallback da UI não pode devolver HTML para API.
- **Schema:** banco próprio do portal; vínculo por ID externo estável com a conta OpenMU. Não gerar schema do jogo a partir dos modelos parciais do site antigo. Configurações, conteúdo e dados privados têm propriedade e limites explícitos.
- **Key models:** PortalAccount, GameAccountLink, Session, VerificationToken, RecoveryToken, SiteSettings, Campaign, NewsPost, Comment, Like, BugReport, RewardDecision, CharacterVisibility e AuditEvent. Posteriores: IntegrationOperation, InventoryReservation, Product, Order, Payment, BenefitGrant, LedgerEntry, Listing, Offer e Transaction. São conceitos duráveis, não nomes de classes obrigatórios.
- **Autenticação:** player/admin, cadastro público somente player, múltiplos admins por script auditado. Sessão web revogável via cookie HttpOnly, proteção CSRF e autorização no servidor por titular/role. Não persistir credenciais/tokens de sessão em localStorage. Material de proteção e revogação precisam funcionar entre instâncias.
- **Autoridade de identidade:** não criar senhas independentes de site/jogo para o mesmo login. Better Auth suporta hashing customizado, mas isso não resolve autoridade, vinculação nem propagação de recuperação de senha. Validar credenciais, username, tokens, recuperação e estado de bloqueio com adaptador OpenMU em uma fatia local antes de consolidar autenticação. Não aplicar migrations do Better Auth sobre schema do jogo.
- **Políticas propostas:** e-mail verificado antes de acessar recursos privados; conta de jogo existente exige vinculação segura, não cadastro duplicado. Durações configuráveis e limites documentados. 2FA permanece sem decisão e será registrado como pendência, sem presumir dispensa definitiva.
- **Simulação:** backend usa simulador persistente de OpenMU, não apenas mocks de navegador; modos simulado/real são explícitos por capacidade, sem fallback silencioso. E-mail em capturador local; pagamento em simulador sem cobranças externas.
- **Consistência:** identificador estável da operação, transações de domínio e registro persistido de trabalho pendente. Efeito externo e banco não são atomicamente garantidos pelo HTTP; timeout após efeito exige consulta/reconciliação. Simulador e adaptador real compartilham contratos/testes comuns e testes específicos adicionais.
- **Tempo/moeda:** timestamps UTC e fuso explícito de apresentação; oficial a confirmar. Valores em reais em unidade inteira; NC/joias em quantidades conforme contrato. Não herdar taxas/arredondamento nem equiparar NC a WCoin.
- **Qualidade transversal:** cada fase contém caminho completo de persistência/fonte, API, UI e testes de comportamento. Autorização, mobile, teclado, movimento reduzido, auditoria e documentação entram na fase relevante; não haverá fases horizontais de “fazer todo banco” ou “testar tudo no final”.

## Fronteiras e validações da arquitetura

O portal será uma aplicação full stack em monólito modular, com interface e backend na mesma aplicação. Os módulos de contas, conteúdo, reports, consultas do jogo e comércio mantêm serviços e regras próprios; componentes React e handlers de servidor não concentram regras de negócio. Separação de responsabilidades não exige processos independentes.

Better Auth gerencia autenticação e sessões; autorização por titularidade e regras de player/admin permanecem explícitas nos módulos. Sua integração com Start e Drizzle é suportada, mas a compatibilidade com identidade OpenMU precisa de prova própria. Definir uma autoridade de credenciais, vínculo estável e comportamento de cadastro/recuperação antes de ampliar autenticação. Se a instalação real não oferecer a capacidade necessária, documentar o contrato ou extensão ausente, sem sincronização fictícia.

Drizzle gerencia somente o banco do portal. Transações locais não garantem atomicidade com o jogo. Adaptadores OpenMU separam leituras, identidade e operações sobre recursos; simulador e integração real compartilham contratos e testes de comportamento, com testes específicos para a instalação real. Não afirmar equivalência comprovada enquanto só o simulador estiver disponível.

A primeira fase valida uma rota pública SSR persistida; as fases de autenticação validam sessão, confirmação de e-mail e autoridade simulada, incluindo isolamento de contas e ausência de credenciais duplicadas. A prova com OpenMU real acontece quando estiver disponível. Hono ou tRPC podem ser avaliados posteriormente se houver uma necessidade concreta que as interfaces atuais não atendam.

## Organização de pastas e direção das dependências

**Decisão:** um repositório e uma aplicação, organizados primeiro por domínio, com responsabilidades separadas dentro de cada módulo. Não iniciar com monorepo de apps/packages nem com diretórios globais de controllers/services/repositories. O objetivo é manter uma mudança de negócio próxima dos seus componentes, contratos e regras, preservando as fronteiras entre navegador, servidor e integração.

A árvore abaixo é uma convenção inicial, não um scaffold a gerar inteiro. Criar módulos e subpastas conforme cada fase precisar; comércio só aparece nas fases posteriores.

```text
projeto/
├── src/
│   ├── routes/                  # arquivos de rota do Start: páginas, layouts e HTTP
│   ├── router.tsx               # configuração do roteador
│   ├── modules/
│   │   ├── accounts/
│   │   ├── news/
│   │   ├── bug-reports/
│   │   ├── rankings/
│   │   ├── events/
│   │   ├── characters/
│   │   ├── site/                # configurações e campanhas do portal
│   │   └── ...                  # inventory, shop, marketplace quando necessários
│   ├── shared/
│   │   ├── ui/                  # primitives shadcn e componentes visuais genéricos
│   │   ├── layout/              # header, footer e composição dos layouts
│   │   ├── types/               # tipos realmente transversais
│   │   └── utils/               # funções puras realmente transversais
│   ├── server/
│   │   ├── auth/                # configuração Better Auth e sessão
│   │   ├── db/                  # conexão, schema Drizzle e composição do banco
│   │   ├── integrations/
│   │   │   ├── openmu/
│   │   │   │   ├── contracts/   # interfaces e formatos independentes do transporte
│   │   │   │   ├── simulated/   # implementação persistente simulada
│   │   │   │   └── real/        # adaptador da instalação real, quando disponível
│   │   │   ├── email/
│   │   │   └── payments/        # posteriormente
│   │   └── composition/         # seleção explícita e montagem dos adaptadores
│   └── styles/                 # tokens, tema e estilos globais
├── drizzle/                    # migrations versionadas e metadados gerados
├── public/                     # assets públicos; nunca anexos privados de reports
├── scripts/                    # criação de admins e operações locais
├── tests/
│   ├── e2e/                    # jornadas completas navegador/servidor
│   ├── contracts/              # suíte comum dos adaptadores
│   └── support/                # fixtures e preparação reutilizáveis
├── docs/                       # arquitetura, operação e pendências de integração
└── plans/                      # PRD e plano
```

Dentro de um domínio, usar esta separação quando houver essas responsabilidades:

```text
modules/news/
├── ui/                         # páginas e componentes específicos de notícias
├── hooks/                      # estado e interação no cliente, quando necessário
├── contracts/                  # entradas validadas, DTOs e tipos compartilháveis
├── domain/                     # regras puras, políticas e modelos de negócio
└── server/
    ├── functions/              # entradas createServerFn, finas
    ├── services/               # casos de uso e coordenação das operações
    └── repositories/           # consultas/persistência Drizzle deste domínio
```

**Rotas e layouts:** `src/routes` segue as convenções de file-based routing do TanStack Start. Arquivos de rota conectam parâmetros, carregamento, metadados e composição da página; delegam UI ao domínio e comportamento ao servidor. Rotas HTTP também ficam nessa árvore. Os layouts público, player e admin diferem em navegação e acesso, mas admin não duplica os módulos de notícias, reports ou contas. O formato dos nomes de rota será fixado com a versão instalada; a árvore gerada pelo roteador não é editada manualmente.

**Dependências permitidas:** UI chama funções de servidor e usa contratos seguros para o cliente; funções de servidor validam entrada e sessão e chamam serviços; serviços aplicam regras de domínio e coordenam persistência/adaptadores. Regras de domínio não importam React, TanStack, Drizzle, Better Auth nem implementações OpenMU. Repositórios e integrações implementam as fronteiras necessárias. Evitar criar interfaces para cada função: elas são necessárias onde há substituição real, como OpenMU simulado/real, e-mail e pagamentos.

**Servidor e navegador:** contratos compartilháveis não importam banco, segredos ou configuração de autenticação. Entradas de servidor seguem as convenções suportadas pelo Start, com `*.functions.ts` e implementações exclusivamente servidor em `*.server.ts` quando aplicável. Nomes de pasta não garantem isolamento: aplicar os mecanismos de restrição de imports do framework e validar o bundle do navegador. Não criar um barrel que reexporte UI, contratos e código servidor juntos.

**Propriedade de dados:** schema Drizzle fica organizado por domínio dentro de `server/db`, com propriedade de cada tabela documentada. Consultas e comandos específicos ficam no repositório do módulo. Schema de autenticação segue a integração Better Auth e permanece restrito ao portal; migrations nunca alcançam o banco OpenMU. Módulos não acessam repositórios privados de outros módulos; necessidades transversais usam operações explícitas e modelos de leitura com proprietário definido. Operações que exigem transação única compartilham o contexto transacional na camada de serviços.

**Código compartilhado:** componentes específicos de notícias ficam em news; primitives e componentes reutilizáveis, como Select, Button e carrossel genérico, ficam em shared/ui. Header/footer ficam em shared/layout e recebem dados/operações pelas fronteiras definidas. Não criar um `utils`, `lib` ou `common` como depósito de regras de negócio. Tipos reutilizáveis têm arquivos dedicados e transformações puras ficam em utilitários próximos do domínio; só promover a shared quando houver responsabilidade transversal clara.

**Testes:** testes de regras, serviços e componentes ficam próximos do código que verificam. `tests` na raiz contém jornadas e contratos que atravessam módulos/adaptadores. A suíte comum de OpenMU roda contra o simulador e, quando disponível, contra a instalação real isolada; registrar capacidades indisponíveis em vez de declarar paridade. Restrições de imports e ausência de segredos no bundle precisam de verificação automatizada nas primeiras fases.

**Convenções:** diretórios e arquivos em inglês e kebab-case, componentes exportados em PascalCase e funções em camelCase; arquivos gerados seguem o framework. Imports entre fronteiras devem ser explícitos, sem dependências circulares. Não criar camadas ou pastas vazias por padrão nem estabelecer limite arbitrário de linhas: separar arquivos por responsabilidade e tamanho compreensível.

**Motivações e custo:** agrupar por domínio reduz a dispersão de mudanças como publicar uma notícia ou aprovar um report. Rotas finas preservam liberdade de evolução do framework; regras separadas permitem testar sem navegador ou jogo. Adaptadores explícitos permitem começar simulado sem espalhar condições pela aplicação. Uma aplicação evita manutenção prematura de pacotes e processos independentes. O custo é manter disciplina nas dependências; verificar imports e propriedade dos módulos impede que a árvore seja apenas cosmética. Essa estrutura é uma decisão do projeto, não uma arquitetura imposta pelo TanStack.

Referências das convenções do framework: [routing](https://tanstack.com/start/latest/docs/framework/react/guide/routing), [rotas HTTP](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) e [funções de servidor](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions).

## Marcos, dependências e conclusão

**Marco A: portal local (1–14).** Fluxos independentes e consultas simuladas, sem movimentação monetária. **Marco B: OpenMU local (15–16)** quando disponível; sua ausência não bloqueia o Marco A. Operação local (17) pode começar no simulador e evoluir com integração real. **Marco C: recursos e comércio (18–24)** fica por último, inicialmente simulado e condicionado às decisões comerciais.

Não realizar produção, cobrança real ou transferência real sem capacidades verificadas e escopo posterior. Não implementar mudança de nome/classe. Ao finalizar cada fase, atualizar cobertura do PRD e documento de pendências com estado comprovado, simulado, parcial, adiado ou bloqueado, evidências e condições para retomada. Consolidar essa documentação no encerramento. Cobertura planejada não significa funcionalidade real concluída.

Configuração oficial, visibilidade pública, links, fornecedor, comissão, VIP, joias, autoridade de NC, ofertas e reembolso têm gates próprios. Não usar exemplos da demo como aprovação. Fases bloqueadas pelo OpenMU ficam registradas, enquanto fluxos independentes continuam.

---

## Phase 1: Primeiro fluxo público persistido

**User stories:** 1, 8, 10, 13, 14, 16, 17, 18, 118, 126, 128, 129.

### What to build

Visitante consulta configuração do servidor persistida e status/jogadores do adaptador simulado por API em uma página nova com header/footer e idioma. Esse percurso estabelece a stack e ambiente local, sem uma fase isolada de infraestrutura.

### Acceptance criteria

- [ ] Configuração persistida chega ao navegador e sobrevive a reinício.
- [ ] Estrutura por domínio aplicada ao primeiro percurso, com rota fina, persistência e adaptador separados; verificar imports servidor/cliente e ausência de segredos no bundle.
- [ ] Layout responsivo, idioma, estados de erro, teclado e reload funcionam.
- [ ] Validar versões fixadas, runtime Node, build SSR/hidratação e acesso PostgreSQL via Drizzle; registrar instruções locais e pendências, sem reutilizar código da demo.

---

## Phase 2: Cadastro e confirmação de e-mail

**User stories:** 21, 22, 23, 24, 131, 133, 136, 137.

### What to build

Visitante cria player, recebe mensagem no capturador local e confirma endereço. Adaptador simulado controla identidade do jogo; cadastro não é apresentado como integração real.

### Acceptance criteria

- [ ] Validar conta/PIN/termos; rejeitar duplicidade; registrar apenas player.
- [ ] Confirmação e reenvio funcionam com token temporário de uso único.
- [ ] Falha do adaptador não deixa cadastro falsamente concluído; estado e e-mail local persistem.

---

## Phase 3: Sessão player e acesso admin

**User stories:** 9, 25, 26, 27, 28, 30, 119, 134, 135, 138, 139, 145.

### What to build

Player faz login e acessa conta; admins criados por script entram em administração separada. Sessão e autorização são verificadas pelo backend.

### Acceptance criteria

- [ ] Criar múltiplos admins sem senha padrão exposta, com auditoria.
- [ ] Cadastro/requisições manipulados não elevam role; player não acessa APIs admin.
- [ ] Login, expiração, logout, retorno seguro e limites funcionam; revogação não depende da memória de um processo.

---

## Phase 4: Recuperação e troca de senha

**User stories:** 29, 31, 132, 133, 134, 135, 136.

### What to build

Player recupera ou altera senha usando e-mail local e a autoridade de credenciais simulada; consulta seus dados de segurança permitidos.

### Acceptance criteria

- [ ] Token expirado/usado não altera conta; respostas não enumeram usuários.
- [ ] Troca exige credencial atual; recuperação e troca atualizam a mesma autoridade.
- [ ] Revogar sessões conforme política registrada; falha de sincronização não produz sucesso falso.

---

## Phase 5: Administração de contas

**User stories:** 28, 120, 134, 140, 145.

### What to build

Admin consulta contas e bloqueia/desbloqueia acesso ao portal com motivo; player observa o efeito. Bloqueio do portal não significa banimento no jogo.

### Acceptance criteria

- [ ] Player não consulta nem altera gestão administrativa.
- [ ] Bloqueio revoga acesso e gera histórico de ator, alvo, motivo e data.
- [ ] Proteger último admin ativo ou documentar/testar recuperação operacional.

---

## Phase 6: Publicação e leitura de notícias

**User stories:** 103, 104, 105, 106, 111, 141.

### What to build

Admin publica/edita notícia; visitante lê feed e artigo por URL permanente. Persistência e apresentação seguem a intenção visual da referência.

### Acceptance criteria

- [ ] Validar título, resumo, categoria, capa, autoria e data.
- [ ] Player não publica; edição preserva ID e interações.
- [ ] Conteúdo persiste e não executa scripts arbitrários; links e reload funcionam.

---

## Phase 7: Interações e moderação do blog

**User stories:** 107, 108, 109, 110, 111, 141.

### What to build

Player curte/comenta/remove participação permitida; admin modera; visitante vê o resultado compartilhado.

### Acceptance criteria

- [ ] Uma curtida por conta/postagem inclusive sob concorrência.
- [ ] Player remove somente seu comentário; intervenção admin é auditada.
- [ ] Interações persistem entre clientes e falha não apaga conteúdo válido.

---

## Phase 8: Envio e acompanhamento de reports

**User stories:** 112, 113, 114, 143.

### What to build

Player envia relato, recebe protocolo e acompanha apenas seus relatos; visitante consulta informações gerais do programa.

### Acceptance criteria

- [ ] Exigir login e validar título/passos/impacto.
- [ ] Titularidade é aplicada na API, não apenas na UI.
- [ ] Histórico sobrevive à troca de sessão; envio não concede recompensa.

---

## Phase 9: Análise administrativa e decisão de recompensa

**User stories:** 7, 114, 115, 116, 117, 142.

### What to build

Admin classifica impacto, registra atendimento e aprova/recusa recompensa. Player acompanha decisão; entrega monetária permanece pendente.

### Acceptance criteria

- [ ] Admin trata todos os reports com auditoria e histórico.
- [ ] Aprovação repetida não gera dois compromissos de recompensa.
- [ ] Decisão e entrega são estados distintos; nenhuma moeda é movimentada aqui.

---

## Phase 10: Ranking e perfil público autorizado

**User stories:** 48, 49, 50, 51, 52, 53, 54.

### What to build

Ranking usa leitura simulada persistida/cacheada; visitante busca/filtra e consulta perfil permitido. Preferência de visibilidade tem alcance aprovado antes de habilitar edição.

### Acceptance criteria

- [ ] Critério e desempate estáveis; busca global não é fingida filtrando apenas dez registros.
- [ ] Destaques conservam posição global; campos privados não aparecem em ranking/perfil/busca.
- [ ] Visibilidade não definida fica pendente; consulta pública mínima continua disponível.

---

## Phase 11: Agenda e contador de eventos

**User stories:** 5, 55, 56, 57, 58, 59, 60, 127.

### What to build

Visitante consulta agenda/esteira alimentada por horários simulados, com UTC, fuso, duração, timetable e multiplicador opcional.

### Acceptance criteria

- [ ] Contador continua correto após suspensão de aba.
- [ ] Configuração inválida não derruba agenda; programação não é execução confirmada.
- [ ] Esteira respeita movimento reduzido, oferece controle e não corta cards pelo padding.

---

## Phase 12: Conta, personagens e cofres somente leitura

**User stories:** 32, 33, 34, 35, 36, 37, 44, 45, 46, 47.

### What to build

Player consulta personagens, cofres, saldos e VIP pelo simulador. Não introduzir alteração de nome/classe, transferência ou cobrança.

### Acceptance criteria

- [ ] Titularidade protege dados; erro não vira saldo zero.
- [ ] Personagens/itens têm IDs estáveis e atributos definidos sem copiar modelos da demo.
- [ ] Não oferecer alteração de nome/classe ou débito de 200 NC; documentar ausência.

---

## Phase 13: Campanhas da home e onboarding administráveis

**User stories:** 2, 3, 4, 6, 7, 15, 19, 20, 118, 144.

### What to build

Admin administra campanhas, links e instruções; visitante vê hero, esteiras, blocos promocionais e download/comunidade com dados persistidos.

### Acceptance criteria

- [ ] Hero mantém enquadramento estável; elementos têm alinhamento e espaçamento consistentes.
- [ ] CTAs apontam a fluxos disponíveis; comércio pendente é identificado ou campanha fica desativada.
- [ ] Sem cliente/link oficial, não fabricar download funcional; documentar pendência e apresentar instruções.

---

## Phase 14: Busca pública

**User stories:** 11, 12.

### What to build

Visitante busca páginas, notícias e perfis autorizados por API; anúncios entram depois no mesmo contrato de busca.

### Acceptance criteria

- [ ] Resultados respeitam publicação/visibilidade; não expõem contas ou reports.
- [ ] Busca vazia, acentos, paginação e ausência de resultados são definidos.
- [ ] Cobertura sem anúncios é documentada até marketplace existir.

---

## Phase 15: OpenMU real local — leituras públicas

**User stories:** 17, 18, 49, 55, 122, 123, 124, 125.

### What to build

Quando a instalação estiver disponível, identificar capacidades e integrar status, jogadores, ranking e agenda reais. Simulador continua em modo explícito separado.

### Acceptance criteria

- [ ] Verificar versão/fork, endpoints, timezone e fonte dos dados sem presumir APIs upstream.
- [ ] Testar contratos comuns mais autenticação de serviço, timeout e indisponibilidade reais.
- [ ] Sem acesso local, fase fica bloqueada/documentada; o portal simulado segue demonstrável. Status/jogadores também devem possuir simulador funcional antes desse gate.

---

## Phase 16: OpenMU real local — identidade e dados privados

**User stories:** 21, 24, 25, 29, 30, 32, 33, 34, 35, 36, 37, 44, 122, 123.

### What to build

Validar cadastro/senha e consultas privadas reais conforme capacidades disponíveis. Vincular identidades sem duplicar credenciais ou conceder acesso por simples coincidência de nome.

### Acceptance criteria

- [ ] Cadastro e senha compatíveis com o jogo são comprovados ponta a ponta localmente.
- [ ] Verificação/e-mail do portal não altera campos do jogo sem contrato suportado.
- [ ] DTOs preservam titularidade e segredos; capacidades inexistentes continuam simuladas/pendentes individualmente.

---

## Phase 17: Operação local e recuperação observável

**User stories:** 120, 121, 124, 125, 130, 145.

### What to build

Admin consulta saúde, auditoria e operações; operador provoca falha/reinício, restaura backup e mede carga dos fluxos já disponíveis. Pode começar no simulador antes de acesso real.

### Acceptance criteria

- [ ] Recomeçar execução/restaurar dados é ensaiado sem perder decisões persistidas.
- [ ] Leituras públicas compartilhadas evitam consulta por visitante; métricas distinguem dependências.
- [ ] Acordar carga representativa e critérios antes de testar; entregar evidência e pendências consolidadas, sem prometer capacidade não medida.

---

## Phase 18: Transferência de itens simulada

**User stories:** 38, 39, 40, 41, 42, 43, 120, 121, 122, 123.

### What to build

Na frente posterior de recursos/comércio, player transfere itens pelo simulador persistente e admin acompanha recuperação. Integração real exige suporte específico.

### Acceptance criteria

- [ ] Repetição/concorrência produz uma transferência e uma propriedade.
- [ ] Conta conecta, cofre cheio e timeout após execução são testados.
- [ ] Sem protocolo real de reserva, não habilitar writes OpenMU; documentar condições e falta de integração.

---

## Phase 19: Catálogo e condições comerciais

**User stories:** 6, 61, 62, 63, 64, 75, 76, 78, 79, 144.

### What to build

Após decisões comerciais, admin publica produtos aprovados e player explora ofertas/condições. Ainda não cria pagamento.

### Acceptance criteria

- [ ] Preços, VIP, renovação e apoio não são herdados do mock.
- [ ] Ofertas versionadas têm moeda, benefícios e elegibilidade explícitos.
- [ ] Meios sem integração não são apresentados como cobrança real disponível.

---

## Phase 20: Pedido e pagamento exclusivamente simulados

**User stories:** 65, 66, 67, 68, 69, 70, 71, 73, 74, 78, 79, 120, 121, 122, 123.

### What to build

Player cria pedido/cobrança fictícia; simulador envia eventos ao backend e a UI acompanha pagamento separado de entrega.

### Acceptance criteria

- [ ] Cliente não aprova pagamento; eventos duplicados/fora de ordem são tratados.
- [ ] Expiração/cancelamento/confirmação tardia têm regra aprovada previamente.
- [ ] Preço e histórico persistem; nenhum evento movimenta dinheiro real.

---

## Phase 21: Entrega simulada de benefícios e saldos

**User stories:** 32, 33, 72, 73, 75, 76, 77, 78, 117, 120, 121, 122, 123.

### What to build

Pagamento ou recompensa aprovado gera concessão persistida ao simulador; player vê resultado e admin recupera falhas.

### Acceptance criteria

- [ ] Referência única evita duplicação de NC/joias/VIP inclusive após reinício entre efeito e resposta.
- [ ] Autoridade de saldo, ledger, renovação e reembolso são definidos antes da implementação.
- [ ] Sem suporte real OpenMU, entrega fica explicitamente simulada e não é declarada concluída no jogo.

---

## Phase 22: Anúncios e descoberta do marketplace

**User stories:** 43, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89.

### What to build

Player anuncia item elegível do cofre simulado; visitante filtra/busca e vendedor consulta/cancela com reserva da propriedade.

### Acceptance criteria

- [ ] Item de outra conta ou já reservado é recusado; cancelamento devolve uma única unidade.
- [ ] Filtros avançados, paginação e preço respeitam unidades monetárias distintas.
- [ ] Joias, preço e aceitação de ofertas têm regras explícitas; pendências não são preenchidas com regras inventadas.

---

## Phase 23: Compra e ofertas em moedas simuladas

**User stories:** 90, 91, 92, 93, 94, 95, 96, 101, 120, 121, 122, 123.

### What to build

Players compram com saldo fictício e negociam ofertas; transação registra transferência, débito e crédito únicos.

### Acceptance criteria

- [ ] Dois compradores disputam um item e no máximo um conclui; compra própria é recusada.
- [ ] Oferta aceita sem saldo não debita/entrega; reserva e validade de oferta estão aprovadas.
- [ ] Comissão/arredondamento/destino têm definição; falha e repetição não duplicam recursos.

---

## Phase 24: Mercado em reais e reservas simuladas

**User stories:** 97, 98, 99, 100, 101, 102, 120, 121, 122, 123.

### What to build

Após definir recebimento, simular vínculo de vendedor, compra em reais, reserva exclusiva e contestação; players acompanham liquidação fictícia.

### Acceptance criteria

- [ ] Reserva usa prazo persistido/configurável, inicialmente 15 minutos, liberado por estado definido.
- [ ] Provedor, comissão, recebimento e confirmação tardia são aprovados antes, sem herdar os 5% do mock.
- [ ] Estorno/contestação e item já transferido são tratados; nenhuma cobrança real; documentar integrações externas ausentes.

## Execução e rastreabilidade

Executar uma fase por vez, com demonstração do percurso completo e critérios de aceite verificados antes de declarar conclusão. As caixas deste documento começam pendentes; planejamento não comprova implementação. Registrar evidências, decisões e lacunas por fase.

As fases 15–16 dependem de acesso ao OpenMU local. Enquanto esse acesso não existir, continuar os fluxos independentes e a validação operacional simulada da fase 17. As fases 18–24 são posteriores e condicionais: movimentações permanecem simuladas e decisões comerciais são fechadas somente quando essa frente começar. Não bloquear conteúdo, reports ou leituras pela ausência de comércio.

Ao encerrar, entregar inventário de funcionalidades reais locais, simuladas, parciais, adiadas e bloqueadas, com dependência, motivo, evidência e condição de retomada. Mudança de nome/classe, produção, cobrança real e movimentações reais não aprovadas continuam fora desta execução.

## Fontes da recomendação técnica

- [React: construção do zero e limites de uma SPA](https://react.dev/learn/build-a-react-app-from-scratch).
- [OpenMU: arquitetura e persistência](https://openmu-docs.munique.net/development/architecture/).

Framework suportado não comprova compatibilidade com a versão OpenMU instalada; essa prova pertence às fases de integração real.

Fontes da reavaliação TypeScript: [Better Auth](https://better-auth.com/docs/introduction), [integração Hono](https://better-auth.com/docs/integrations/hono), [hashing e senha](https://better-auth.com/docs/authentication/email-password), [tRPC](https://trpc.io/docs/), [Hono RPC](https://hono.dev/docs/guides/rpc), [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview) e [SSR no Router](https://tanstack.com/router/latest/docs/framework/react/guide/ssr).

Fontes da stack acordada: [Better Auth com TanStack Start](https://better-auth.com/docs/integrations/tanstack), [Better Auth com Drizzle](https://better-auth.com/docs/adapters/drizzle), [funções de servidor do Start](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) e [transações Drizzle](https://orm.drizzle.team/docs/transactions).
