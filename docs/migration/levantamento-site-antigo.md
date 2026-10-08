# Levantamento do site atual e caminhos para o novo MU Nightmare

Data: 07/10/2026. Repositório analisado: `openmu-simple-web`, commit `4b1725a`. Comparação: código local do protótipo `mu-nightmare`. Você confirmou que esse é o código do site atual.

## Conclusão principal

O site atual é uma aplicação ASP.NET Core 8 que entrega cinco páginas HTML e seis endpoints HTTP. O navegador chama essa aplicação usando URLs relativas `/api/...`. O backend consulta e altera diretamente o PostgreSQL do OpenMU, verifica uma porta TCP do servidor e consulta uma rota HTTP do jogo para contar jogadores.

Podemos trocar a interface por React mantendo inicialmente esse backend e as contas existentes. Isso não exige migrar usuários para outro banco. Porém, o backend atual não oferece autenticação web, área privada, loja, pagamentos, marketplace, notícias ou relatos de bugs. Esses fluxos do protótipo são novos serviços a implementar, não integrações prontas escondidas no site antigo.

Há uma diferença entre preservar as funcionalidades atuais e colocar todo o protótipo em produção. A primeira entrega cabe em seis integrações e ajustes de implantação. A segunda envolve sessão, autorização, persistência compartilhada, operações transacionais e integração com o estado do jogo.

## Escopo e limites da investigação

- Foram examinados todos os arquivos de implementação C#, as cinco páginas HTML, scripts, traduções, CSS, configuração e arquivos de implantação do repositório antigo.
- Foram comparados as rotas, autenticação simulada, estado, pagamentos, ranking, eventos e blog do protótipo.
- Valores de credenciais não foram copiados para este relatório. Configuração foi examinada apenas para identificar dependências e tratamento de segredos.
- Nenhuma conta foi criada, nenhuma senha alterada e nenhuma operação foi executada no banco ou servidor do jogo.
- O SDK `dotnet` não está disponível no terminal deste ambiente. Compilação e execução do backend não foram verificadas. As conclusões sobre suas regras vêm da leitura do código.
- A consulta ao domínio `munightmare.site` pela ferramenta web não conseguiu abrir a página. Não foram verificados o proxy, TLS, configuração efetiva, schema, índices ou dados de produção. A confirmação de que este é o código em uso veio de você.
- O README descreve uma implementação planejada e um `config.js` que não existe. Ele não corresponde à arquitetura implementada; o código é a evidência usada aqui.

## 1. Arquitetura existente

O caminho de uma requisição é:

1. Navegador → páginas e arquivos de `wwwroot`, servidos pelo ASP.NET Core.
2. JavaScript dessas páginas → endpoints `/api` no mesmo domínio.
3. Endpoint → uma das três dependências abaixo:
   - PostgreSQL: cadastro, senha, ranking e agenda de eventos.
   - TCP `ServerCheck:Host:Port`: indicador de servidor online.
   - HTTP `http://{ServerCheck:Host}:8080/api/status`: contagem de jogadores.
4. Resposta JSON → atualização da interface por JavaScript e `innerHTML`/`innerText`.

O frontend antigo **não acessa o banco** e **não fala diretamente com a API HTTP do jogo**. A aplicação .NET é a intermediária. Só a contagem de jogadores usa a API HTTP externa do jogo neste código; os demais dados de negócio vêm do banco.

Evidências: [Program.cs](</home/p4van772000/projetos pessoais/openmu-simple-web/Program.cs:9>), [DbContext](</home/p4van772000/projetos pessoais/openmu-simple-web/Data/OpenMuContext.cs:6>), [consulta ao jogo](</home/p4van772000/projetos pessoais/openmu-simple-web/Program.cs:91>).

### Tecnologias e organização

- ASP.NET Core / .NET 8, Minimal APIs, Entity Framework Core e Npgsql.
- `BCrypt.Net-Next` para criar e verificar hashes de senha.
- Frontend HTML/CSS/JavaScript sem build, com código de comportamento dentro das páginas.
- `Endpoints/`: regras e consultas, separadas por cadastro, senha, ranking e eventos.
- `Models/` e `Data/`: mapeamento parcial do banco do jogo.
- `Services/RateLimiter.cs`: limitador ativo em memória. `PasswordRateLimiter.cs` e `RankingRateLimiter.cs` existem, mas não são os serviços registrados/usados pelos endpoints atuais.
- Sem documentação OpenAPI, migrations do banco, projeto de testes ou contrato versionado no repositório.

## 2. Tudo que a interface atual faz

### Home — `/` e `index.html`

Mostra apresentação, dados estáticos do servidor, botão de download, Discord, links para cadastro, troca de senha, ranking e eventos. Consulta status e jogadores na abertura e depois a cada 30 segundos.

Se a consulta de status falhar, a interface mostra offline. Se a contagem falhar ou vier nula, mostra `---`. Não distingue servidor desligado de indisponibilidade do backend/rede.

Experiência, drop, versão e limites vêm de `content.js`, não de uma API. O arquivo contém x50 EXP, x30 Master EXP, drop 70%, nível 400, master level 200, 100 resets, 400 pontos por reset e Season 6 Ep 3. O link de download é `#` e o Discord é `your-invite`. Esses são valores do código, não comprovação da configuração real do servidor.

### Cadastro — `/register` e `register.html`

Formulário público com conta, e-mail, senha, confirmação e PIN. Envia `FormData`, inclui idioma e o cabeçalho exigido pela API. Desabilita o botão durante o envio, traduz o código retornado, mostra sucesso/erro e limpa o formulário após sucesso.

Cria uma conta utilizável pelo jogo e um cofre no banco. Não inicia uma sessão web, não envia confirmação de e-mail e não redireciona para uma área logada.

### Troca de senha — `/changepass` e `changepass.html`

Formulário público com nome de conta, senha atual e nova senha. A própria senha atual autoriza a alteração. Exibe mensagens e limpa os campos após sucesso. Não há recuperação de senha esquecida, link por e-mail ou campo de confirmação na interface antiga.

### Ranking — `/stats` e `stats.html`

Carrega uma lista de até dez personagens, uma vez ao abrir a página. Exibe posição, nome, classe e nível; o backend também retorna resets e experiência. Consulta status a cada 30 segundos. Possui tratamento de lista vazia e erro.

Não tem filtro, busca, paginação, perfil de personagem, ranking de guildas ou atualização automática da lista. As posições são calculadas no navegador pela ordem da resposta.

### Eventos — `/events` e `events.html`

Consulta agenda na abertura e a cada 60 segundos; atualiza o contador visual a cada segundo. Mostra nome, duração, próxima execução, horários diários e multiplicador de experiência quando informado. Tem estilos por evento e tratamento de lista vazia/erro.

A apresentação prioriza Happy Hour, Chaos Castle, Blood Castle, Devil Square, Red Dragon e Golden Invasion. O contador é decrementado por `setInterval`, para em zero e recebe novos dados no próximo polling; não mede continuamente uma data absoluta e pode atrasar quando a aba é suspensa. Não confirma que o evento começou de fato.

### Idiomas e navegação

As cinco páginas oferecem inglês e polonês. A preferência fica em `localStorage` sob `preferred-lang`; traduções são carregadas por `en.js` e `pl.js`. O HTML utiliza atributos de tradução para textos e placeholders. `translations.js` duplica dicionários e `template_lang.js` é um modelo, sem carregamento pelas páginas atuais.

Rotas amigáveis são reescritas para arquivos HTML. Não há roteador SPA nem fallback universal para páginas React.

Evidências: [reescritas](</home/p4van772000/projetos pessoais/openmu-simple-web/Program.cs:34>), [home](</home/p4van772000/projetos pessoais/openmu-simple-web/wwwroot/index.html:260>), [cadastro](</home/p4van772000/projetos pessoais/openmu-simple-web/wwwroot/register.html:79>), [senha](</home/p4van772000/projetos pessoais/openmu-simple-web/wwwroot/changepass.html:64>), [ranking](</home/p4van772000/projetos pessoais/openmu-simple-web/wwwroot/stats.html:100>), [eventos](</home/p4van772000/projetos pessoais/openmu-simple-web/wwwroot/events.html:280>).

## 3. Contratos da API

Os exemplos abaixo são ilustrativos, não respostas capturadas em produção. Não existe envelope uniforme: leituras retornam objetos/listas; operações retornam `{code, message?}`. Os endpoints não usam token ou cookie de autenticação.

### `POST /api/register`

**Formato:** `multipart/form-data` usado pelo site. O código lê formulário via `ReadFormAsync`; não lê body JSON. `application/x-www-form-urlencoded` também é compatível com essa leitura.

**Cabeçalho obrigatório:** `X-Requested-With: XMLHttpRequest`. É uma verificação de formato da chamada, não autenticação.

**Campos e validações:**

- `username`: trim, 3–10 caracteres ASCII alfanuméricos, não pode já existir como `LoginName`.
- `password`: 8–16 caracteres.
- `confirmPassword`: igual à senha.
- `securityCode`: 6–10 dígitos.
- `email`: trim, validado por `MailAddress.TryCreate`.
- `language`: salvo em `LanguageIsoCode`; o backend não valida uma lista de idiomas. O fallback com `?? "en"` não cobre string vazia retornada por `ToString()`.

**Efeito:** cria `data.ItemStorage` com dinheiro zero; salva; cria `data.Account` com hash BCrypt, PIN, e-mail, data UTC e vínculo com esse cofre; salva novamente. A restrição de cadastro por IP é registrada só depois do sucesso.

**Respostas:**

- 200: `REGISTRATION_SUCCESS`.
- 400: `INVALID_REQUEST`, `INVALID_USERNAME`, `INVALID_PASSWORD_LENGTH`, `PASSWORDS_DO_NOT_MATCH`, `INVALID_SECURITY_CODE`, `INVALID_EMAIL`, `USERNAME_TAKEN`.
- 429: `RATE_LIMIT_IP`, após um cadastro bem-sucedido no mesmo IP nas últimas 24 horas.
- 500: `SERVER_ERROR`.

Não há transação explícita envolvendo os dois salvamentos, sessão, aprovação de termos no backend, confirmação de e-mail ou limitação de todas as tentativas falhas de cadastro.

Evidência: [RegistrationEndpoints.cs](</home/p4van772000/projetos pessoais/openmu-simple-web/Endpoints/RegistrationEndpoints.cs:13>).

### `POST /api/change-password`

**Formato/cabeçalho:** formulário e `X-Requested-With: XMLHttpRequest`.

**Campos:** `username` com trim, `oldPassword`, `newPassword`. Verifica existência da conta e BCrypt da senha atual, valida nova senha de 8–16 caracteres e substitui o hash no banco. Não recebe confirmação nem PIN.

**Respostas:**

- 200: `PASSWORD_CHANGE_SUCCESS`.
- 400: `INVALID_REQUEST`, `INVALID_PASSWORD_LENGTH`.
- 401: `INVALID_OLD_PASSWORD`.
- 404: `USER_NOT_FOUND`.
- 429: `RATE_LIMIT_PASSWORD`, mais de cinco tentativas por IP em 15 minutos.
- 500: `SERVER_ERROR`.

Tentativas de validação e sucessos contam no limite após a checagem do cabeçalho. Não há sessão para revogar após a troca; não existe login web nesse backend.

Evidência: [PasswordEndpoints.cs](</home/p4van772000/projetos pessoais/openmu-simple-web/Endpoints/PasswordEndpoints.cs:12>).

### `GET /api/public/server-status`

```json
{ "online": true }
```

Abre conexão TCP com `ServerCheck:Host` e `ServerCheck:Port`, timeout de dois segundos. Qualquer falha vira `{ "online": false }`, também com HTTP 200. Host padrão `openmu-server`, porta padrão `44406`.

Isso comprova apenas conexão à porta. Não comprova saúde de todos os serviços do jogo, capacidade, manutenção ou possibilidade de autenticar um jogador. Não há cache ou limitador nesse endpoint.

Evidência: [Program.cs](</home/p4van772000/projetos pessoais/openmu-simple-web/Program.cs:73>).

### `GET /api/public/online-players`

```json
{ "playerCount": 284 }
```

Faz GET no serviço do jogo `http://{serverHost}:8080/api/status`, espera `{ "players": número }` e transforma para `playerCount`. Timeout de três segundos. Erros de rede, HTTP ou JSON retornam `{ "playerCount": null }` com HTTP 200; o log está em nível Debug.

A porta HTTP `8080` e o path `/api/status` são fixos no código. O serviço externo que implementa essa rota não está neste repositório. Não há forwarding de token, retry, cache ou limitador aqui.

Evidência: [Program.cs](</home/p4van772000/projetos pessoais/openmu-simple-web/Program.cs:91>).

### `GET /api/public/ranking`

```json
[
  {
    "name": "Raven",
    "experience": 125000,
    "className": "Blade Knight",
    "level": 400,
    "resets": 250
  }
]
```

Consulta SQL diretamente no banco. Relaciona `data.Character`, `config.CharacterClass`, `data.StatAttribute` e `config.AttributeDefinition`. Nível/resets são atributos identificados pelos nomes `Level` e `Resets`. Faltando valores, usa nível 1 e resets 0.

Ordena por resets decrescentes e depois experiência decrescente, limitando a dez. Não existe critério adicional estável para empates nem `id`, `position`, `score`, `total`, paginação ou parâmetros de filtro. O campo `experience` não é automaticamente o mesmo conceito que o `score` fictício do protótipo.

Mais de 30 chamadas/minuto/IP retorna 429 `RATE_LIMIT_RANKING`; falha retorna 500 `DATABASE_ERROR`. Uma lista vazia retorna 200 `[]`.

Evidência: [RankingEndpoints.cs](</home/p4van772000/projetos pessoais/openmu-simple-web/Endpoints/RankingEndpoints.cs:13>).

### `GET /api/public/events`

```json
[
  {
    "name": "Happy Hour",
    "nextRunUtc": "2026-10-07T23:00:00.0000000Z",
    "countdownSeconds": 3600,
    "durationMinutes": 60,
    "timetable": ["12:00", "20:00"],
    "nextRunLocal": "20:00",
    "experienceMultiplier": 2.0
  }
]
```

Há uma allowlist de seis GUIDs de plugins: Red Dragon Invasion, Golden Invasion, Blood Castle, Chaos Castle, Devil Square e Happy Hour. Consulta `config.PlugInConfiguration`, apenas `IsActive=true`, usando parâmetros SQL para os GUIDs.

Lê `CustomConfiguration` como JSON, obtém `Timetable` (array direto ou dentro de `$values`), `TaskDuration` e `ExperienceMultiplier` opcional. Procura o próximo horário de hoje ou o primeiro de amanhã no fuso `TimeZoneInfo.Local`, converte para UTC e calcula o contador.

Não retorna ID do plugin, fuso explícito, horário anterior, evento realmente em execução ou regra de calendário semanal. `IsActive` significa plugin habilitado, não evento acontecendo. Castle Siege não faz parte dessa allowlist.

Mais de 30 chamadas/minuto/IP retorna 429 com o código **`RATE_LIMIT_RANKING`**, uma inconsistência existente. Falha retorna 500 `DATABASE_ERROR`; lista vazia retorna 200 `[]`. Uma configuração inválida ou timetable vazio pode provocar falha na lista inteira, pois o tratamento de erro envolve todo o endpoint.

Evidência: [EventsEndpoints.cs](</home/p4van772000/projetos pessoais/openmu-simple-web/Endpoints/EventsEndpoints.cs:12>).

## 4. Dependência do banco do jogo

### Escritas existentes

- `data.Account`: identidade, hash de senha, PIN, e-mail, idioma, cadastro e `VaultId`.
- `data.ItemStorage`: criação do cofre com `Money=0`.
- Troca de senha atualiza `Account.PasswordHash`.

O PIN é salvo como string sem hash pelo endpoint; não deve ser reenviado ao frontend nem incluído em um futuro DTO público. Antes de mudar esse armazenamento, precisamos confirmar como o jogo o utiliza.

### Leituras existentes

- Ranking: personagens, classes e atributos Level/Resets.
- Eventos: configurações dos plugins, não uma tabela editorial de eventos do site.

O modelo EF é parcial. `Character` só mapeia ID, nome, experiência e classe; `ItemStorage` só mapeia ID e dinheiro. Não existe leitura de inventário detalhado, transferência de itens, reset, venda de personagens ou moedas do site.

Não há schema/migrations nem garantia de índices/constraints documentada nesse repositório. A existência de índice único em conta, formato integral dos itens e regras de atualização online precisam ser verificados no OpenMU real. Não devemos executar migrations geradas desse modelo parcial sobre o banco do jogo.

## 5. Configuração e implantação

### Configuração necessária

- `ConnectionStrings:DefaultConnection`: PostgreSQL do OpenMU.
- `ServerCheck:Host` e `ServerCheck:Port`: verificação TCP; o mesmo host alimenta a URL de jogadores.
- `Logging` e `AllowedHosts`.
- Variáveis do Compose: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `WEB_PORT`, `SERVER_CHECK_HOST`, `SERVER_CHECK_PORT`, `TIMEZ`.

### Container

Build em SDK .NET 8, publicação da aplicação e runtime Ubuntu 24.04 com .NET/ASP.NET 8 e tzdata. Executa como usuário `ubuntu`, escuta HTTP 8080 e publica a porta `${WEB_PORT:-8088}`. Healthcheck abre a porta local: não testa banco nem jogo.

O Compose exige a rede Docker externa `openmu-network`; não cria banco nem servidor de jogo. A configuração de fuso `TZ=${TIMEZ}` interfere diretamente nos horários dos eventos. A aplicação deve estar em uma rede que alcance PostgreSQL, a porta TCP e o serviço HTTP do jogo.

O repositório não traz configuração de domínio, certificado, proxy reverso ou forwarded headers. Isso pode existir fora dele em produção e deve ser levantado antes da troca.

**Ponto relevante confirmado:** `.env` e `appsettings.json` são arquivos rastreados pelo Git; `appsettings.json` contém senha na connection string. Não há `.gitignore` ou `.dockerignore` na raiz. Os valores não são reproduzidos aqui. Confirmar se as credenciais são reais e ainda válidas; se forem, retirar do código, injetar por segredo de implantação e rotacionar as credenciais expostas no histórico. A exclusão do arquivo num commit não elimina versões anteriores.

Evidências: [Compose](</home/p4van772000/projetos pessoais/openmu-simple-web/docker-compose.yaml:1>), [Dockerfile](</home/p4van772000/projetos pessoais/openmu-simple-web/Dockerfile:1>).

## 6. Diferenças concretas no protótipo

### Funcionalidades atuais que já têm uma tela equivalente

- Home/header: trocar `serverInfo.online`/`players` fixos pelas duas consultas. Separar erro/desconhecido de offline e não converter `null` em zero.
- Cadastro: mapear `confirm` → `confirmPassword`, `pin` → `securityCode`, incluir `language`, enviar formulário e tratar códigos de erro. As validações de usuário/senha/PIN já são semelhantes.
- Troca de senha: mapear `old` → `oldPassword` e `password` → `newPassword`. A confirmação pode continuar como validação da UI; o endpoint antigo não a recebe.
- Ranking: adaptar a lista, remover dependência de `score` fictício e decidir se a busca filtra apenas top 10 ou se o backend será ampliado. Manter posições globais e badges ao filtrar.
- Eventos: integrar calendário, duração, multiplicador, próximo horário e contador. Preservar a UI de cards/esteira, mas recuperar as informações funcionais que a página antiga fornece.

### Divergências que afetam comportamento

1. **Cadastro não faz login no site antigo.** O reducer novo cria usuário e sessão local imediatamente. O endpoint real só cria a conta. Para manter o fluxo novo de ir direto à conta, precisaremos de autenticação web real após o cadastro ou de um contrato que crie sessão.
2. **Ranking novo é fictício e tem 20 entradas.** A API tem dez, não oferece perfil nem filtros globais; nomes de classes precisam vir dos dados reais, não só das quatro opções fixas atuais.
3. **Eventos novos são quatro cards estáticos em BRT.** Há Castle Siege no mock, ausente da API. O código antigo oferece seis eventos diferentes e horários baseados no container. Não assumir XP ×3 para todos: `experienceMultiplier` é opcional.
4. **Rates conflitantes.** Novo mock: EXP ×3, master ×1,5, drop ×3 e 250 resets. Antigo estático: EXP ×50, master ×30, drop 70% e 100 resets. Precisamos de valores aprovados e uma única fonte de configuração; porcentagem de drop e multiplicador não são unidades equivalentes.
5. **Idioma de conta e idioma visual são coisas diferentes.** O site antigo salva `en`/`pl` na conta. Conferir suporte do OpenMU antes de enviar outros códigos usados na UI nova.
6. **Download/Discord não estão configurados no código antigo.** Exigem URLs reais aprovadas, não chamadas à API já existentes.

### Funcionalidades novas sem suporte neste backend

- Login/logout, consulta da sessão, papéis de administrador e proteção de operações.
- Perfil privado, histórico e edição de dados da conta.
- Listagem de personagens da conta, ocultação em rankings, reset e outras ações.
- Inventário/cofre detalhado, movimentação jogo ↔ site, joias e Nightmare Coins.
- Loja, catálogo persistido, VIP, pedidos, cobrança PIX, entrega e reembolso.
- Marketplace, reserva de itens, ofertas, comissão, pagamento e liquidação.
- Blog compartilhado, publicação pelos donos, comentários, likes e moderação.
- Relatos de bugs, acompanhamento e concessão de recompensas.
- Busca global com dados reais, integração Discord/vínculo externo e conteúdo administrativo.

O `GameProvider` grava o estado em `localStorage`; login compara senha local; contas guardam senha/PIN no modelo de demonstração. Blog também usa armazenamento local e considera `username === "demo"` como dono. Isso é comportamento de protótipo. Em produção, identidade e permissões devem ser verificadas no backend; saldos, itens e estados de pagamento não podem ser aceitos como verdade a partir do navegador.

Evidências: [provider](</home/p4van772000/projetos pessoais/mu-nightmare/src/store/GameProvider.tsx:9>), [login/cadastro mock](</home/p4van772000/projetos pessoais/mu-nightmare/src/features/auth/useAuthForm.ts:13>), [estado persistido](</home/p4van772000/projetos pessoais/mu-nightmare/src/lib/storage.ts:1>), [blog](</home/p4van772000/projetos pessoais/mu-nightmare/src/features/blog/store.ts:4>), [rotas](</home/p4van772000/projetos pessoais/mu-nightmare/src/App.tsx:65>).

## 7. Dificuldades e ajustes prioritários

### Prioridade alta antes de operações reais

- **Credenciais versionadas:** confirmado rastreamento de configuração sensível. Validar autenticidade/validade e corrigir armazenamento/rotação quando aplicável.
- **Cadastro com dois commits:** confirmado; falha no segundo salvamento pode deixar cofre órfão. Usar transação abrangendo cofre e conta, validar constraints reais e testar rollback. A consulta de conta/IP e a gravação não formam operação atômica; o resultado de requisições simultâneas depende também das constraints do banco.
- **Autorização inexistente para novas funções:** não há middleware ou endpoints de sessão. Criar autenticação antes de conectar dados privados, CMS, carteiras ou operações do jogo. `X-Requested-With` não substitui autenticação ou proteção CSRF.
- **Sincronização com jogo:** não há serviço de transferência/reserva nesta base. Precisamos descobrir como o OpenMU mantém conta/personagens/itens em memória e como executar comandos compatíveis. Escrever diretamente itens/saldos enquanto o jogador está online pode causar conflitos ou perda; é risco arquitetural a investigar, não incidente observado.
- **Pagamentos e marketplace:** aplicar autorização por titular, idempotência, confirmação pelo provedor, estados persistidos, reserva/entrega transacionais e trilha de auditoria. O timer e a mudança de status no cliente atuais não equivalem a confirmação de pagamento.

### Ajustes de integração e confiabilidade

- **Limites por IP:** armazenados por processo e resetados ao reiniciar. Réplicas não compartilham limites. Sem forwarded headers configurados neste código, um proxy pode fazer todos parecerem o mesmo IP; confirmar topologia e confiar apenas em proxies conhecidos.
- **Cadastro limita sucesso, não todas as tentativas:** complementação necessária se houver abuso/volume; limite de uma conta/dia também afeta jogadores atrás de NAT compartilhado.
- **CORS aberto:** `AllowAnyOrigin/Method/Header`. Se mantivermos uma origem única, não precisamos dessa política ampla; com sessão, definir origem/credentials/CSRF conscientemente.
- **Informação de conta na senha:** 404 para usuário inexistente e 401 para senha incorreta permitem distinguir existência. Uniformizar erro externo na futura autenticação e manter diagnóstico interno.
- **Agenda frágil:** JSON inválido/timetable vazio em um plugin derruba toda a lista. Validar por plugin, preservar resultados válidos, registrar falhas e expor fuso/ID estáveis.
- **Status limitado:** TCP aberto e `{playerCount:null}` devem ter semântica explícita. Cache curto evita criar uma conexão por usuário a cada atualização; erro operacional não deve virar certeza de offline.
- **Ranking limitado:** para filtros reais, paginar/filtrar no servidor e escolher desempate estável. A consulta faz subconsultas por atributos; avaliar índices e plano com dados representativos antes de afirmar necessidade de otimização.
- **Renderização antiga com `innerHTML`:** ranking interpola nome e classe sem escape. Exploração depende do que pode ser gravado no banco; essa proteção não está comprovada aqui. Na migração, renderizar como texto React e evitar HTML bruto vindo do servidor.
- **Contrato de erros:** traduzir por `code` no cliente, sem depender da mensagem inglesa; corrigir código do limite de eventos e definir DTOs/tipos consistentes.
- **Testabilidade:** criar testes de contrato e integração em banco de homologação antes de alterar os writes; não testar cadastro/senha contra contas reais.

## 8. Caminhos possíveis

### Caminho recomendado: conservar .NET e substituir a interface

Manter inicialmente endpoints e banco atuais, adicionar uma camada de acesso HTTP no React e servir o build React no mesmo domínio da API. Separar backend e frontend no código sem obrigatoriamente separar as origens públicas.

Vantagens: preserva cadastro compatível com OpenMU/BCrypt, evita reimplementar SQL e eventos de imediato, mantém contas no banco existente e permite entrega incremental. Custos: evoluir o backend, corrigir os pontos acima e reorganizar o deploy das rotas HTML para SPA.

Organização proposta, ainda não implementada:

- No React: cliente HTTP comum, DTOs separados, adaptadores de cadastro/ranking/eventos/status, hooks por domínio e componentes focados em UI. Mock e API devem ficar atrás das mesmas interfaces, com configuração explícita por ambiente.
- No .NET: endpoints finos, serviços de domínio, acesso ao OpenMU isolado, contratos públicos e privados separados, autorização e testes. Conteúdo/pagamentos podem usar persistência própria do site sem alterar arbitrariamente schemas do jogo.
- Implantação: `/api/*` sempre vai ao backend; demais rotas válidas vão ao React. Manter `/register`, `/changepass`, `/stats` e `/events`; tratar URLs `.html` antigas se ainda forem usadas.

### Frontend hospedado separado

É viável hospedar o React em CDN/Vercel e manter .NET perto do jogo, preferencialmente por proxy no mesmo domínio. Precisará de roteamento da API, HTTPS, configuração por ambiente e estratégia de sessão. O `vercel.json` atual manda tudo para `index.html`; não encaminha `/api` ao .NET. O `vite.config.ts` atual também não tem proxy de desenvolvimento.

### Reescrever o backend

É possível, mas aumenta o trabalho inicial: reimplementar regras, BCrypt, SQL, serialização de plugins, timezone, limitações e compatibilidade do banco. Não há evidência de que essa reescrita seja necessária para integrar a interface React. Escolher só se houver motivo de infraestrutura/manutenção validado.

## 9. Sequência de migração e critérios de conclusão

### Etapa 1 — baseline e homologação

Confirmar versão do OpenMU, schema/constraints, configurações reais, fuso, rede, proxy e serviço `/api/status`. Separar homologação, credenciais e backup/restauração. Registrar exemplos reais sanitizados dos seis contratos.

**Concluída quando:** sabemos executar o backend isoladamente, ler contratos reais e testar writes em um banco descartável sem afetar jogo/contas reais.

### Etapa 2 — paridade pública

Conectar status/jogadores, ranking e agenda. Centralizar rates/links aprovados. Preservar o visual, esteiras e destaques, incluindo countdown/horários/multiplicador da agenda antiga. Garantir loading, vazio, erro, stale e timezone.

**Concluída quando:** dados reais aparecem corretamente, falhas são distinguíveis e a UI cobre todas as leituras do site antigo.

### Etapa 3 — cadastro e senha reais

Implementar adaptadores de formulário/erros, corrigir atomicidade de cadastro e validar limite/proxy. Definir comportamento pós-cadastro sem prometer sessão inexistente.

**Concluída quando:** testes de homologação comprovam criação com cofre, rejeição de entradas inválidas, rollback, limite e senha funcionando no jogo.

### Etapa 4 — autenticação e área de conta

Criar login/logout/sessão e autorização. Consultar conta/personagens por identidade autenticada. Remover credenciais do estado do cliente e delimitar ações permitidas/condições de jogador online. Definir compatibilidade com bloqueio/estado da conta no OpenMU.

**Concluída quando:** um usuário não consegue consultar/alterar dados de outro, a sessão expira/revoga e os fluxos privados deixam de depender do mock.

### Etapa 5 — conteúdo e atendimento

Persistir notícias, comentários e reports; roles de donos/moderadores, upload/conteúdo e processo de recompensa. Separar publicação administrativa de interação pública.

**Concluída quando:** conteúdo é compartilhado entre usuários/dispositivos e permissões são aplicadas no servidor.

### Etapa 6 — loja e marketplace

Implementar catálogo, pedidos, provedor PIX, ledger de moedas, VIP e entrega compatível com o jogo. Depois negociar itens/ofertas com reserva e liquidação; validar concorrência, expiração, reembolso e reconciliação.

**Concluída quando:** confirmar um pagamento duas vezes não duplica entrega; dois compradores não recebem o mesmo item; falhas permitem recuperação e auditoria.

### Etapa 7 — troca da interface pública

Publicar React preservando `/api`, links antigos e caminhos necessários. Healthcheck real, logs, monitoramento e possibilidade de voltar à interface anterior. Liberar funções novas apenas quando seu backend estiver pronto, usando flags explícitas.

**Concluída quando:** navegação direta/reload funciona em todas as rotas, API não recebe HTML, ativos carregam e o rollback foi ensaiado.

Essas etapas indicam dependências técnicas, não uma estimativa fechada de prazo. Homologação e conhecimento do OpenMU determinam o esforço dos fluxos de conta/comércio.

## 10. Informações ainda necessárias

O código resolve o inventário funcional. Para fechar execução e estimativas, faltam:

- Versão/commit e configuração do servidor OpenMU que compartilha esse PostgreSQL.
- Schema e constraints reais, especialmente nomes de conta, atributos, plugins e armazenamento de itens.
- Onde roda hoje o container, como domínio/TLS/proxy apontam para ele e quais headers de IP chegam.
- Resposta real sanitizada de `/api/status` e disponibilidade desse serviço na rede.
- Rates e limites oficiais, timezone e URLs reais de download/Discord.
- Regras de login/contas bloqueadas, alterações de personagens e sincronização com jogador conectado.
- Provedor e regras de cobrança/entrega, moedas, VIP, comissão, ofertas e recompensas — novos requisitos, não funcionalidades do backend antigo.

Nenhuma implementação de migração foi feita nesta investigação. Os dois aplicativos foram preservados; este relatório é a base para escolher e detalhar as próximas entregas.

## Complemento — capacidades do OpenMU oficial, consultadas em 07/10/2026

O inventário acima descreve o backend do **site fornecido**, não todas as capacidades do servidor OpenMU. A pesquisa subsequente no código oficial `master` identificou APIs que podem reduzir a necessidade de acesso direto ao banco. Elas **não foram verificadas na versão instalada do Nightmare**.

- O `ServerController` oficial implementa `/api/status` e `/api/is-online/{accountName}`. Isso identifica uma implementação oficial compatível com o path chamado pelo site antigo, mas não comprova qual versão/fork responde em produção.
- A documentação atual descreve autenticação de aplicações com `X-Api-Key` e permissões. Essa chave deve ficar no backend do site. O código antigo chama status sem essa chave; portanto, atualizar o OpenMU pode exigir ajustar a integração.
- O `AccountController` oficial oferece `POST /api/accounts` para cadastro. O contrato é diferente do cadastro local: não substituir sem comparar PIN, cofre, validações e versão efetiva. Cadastro do jogo não cria automaticamente uma sessão de usuário no nosso site.
- O `CashShopController` oficial oferece consulta de moedas e `POST /api/accounts/{loginName}/cash-shop/grants`, com referência para evitar reaplicação de uma concessão. O código informa que o jogo aplica créditos quando o jogador abre o cash shop. Isso é integração de moeda, não uma loja web/PIX/marketplace completos. Precisamos definir se Nightmare Coins corresponde a uma moeda suportada do jogo ou a saldo próprio do site.
- A arquitetura oficial carrega a conta em um contexto por jogador e salva durante o jogo. Alterar dados no banco não garante atualizar o estado já carregado de um jogador conectado. Transferência de itens, resets e entrega de recompensas exigem operação compatível com esse contexto; consultar “offline” e depois escrever, isoladamente, não elimina uma corrida com login simultâneo.

Separação recomendada: nosso backend controla login web, autorização, conteúdo, reports, pedidos e pagamentos. Operações que afetam o jogo passam por um adaptador do OpenMU, usando API oficial quando existir na instalação e uma extensão controlada quando faltar. O cliente MU comunica-se com os servidores OpenMU pelo protocolo do jogo; ele não depende de conversar com o site para jogar.

Fontes oficiais: [arquitetura](https://openmu-docs.munique.net/development/architecture/), [API e autenticação de aplicações](https://openmu-docs.munique.net/admin-panel/authentication/), [ServerController](https://github.com/MUnique/OpenMU/blob/master/src/Web/AdminPanel/API/ServerController.cs), [AccountController](https://github.com/MUnique/OpenMU/blob/master/src/Web/AdminPanel/API/AccountController.cs), [CashShopController](https://github.com/MUnique/OpenMU/blob/master/src/Web/AdminPanel/API/CashShopController.cs).
