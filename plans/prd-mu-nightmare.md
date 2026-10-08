# PRD — MU Nightmare: portal completo integrado ao OpenMU

Data: 07/10/2026. Estado: rascunho para validação de produto; execução exclusivamente local. Base: requisitos discutidos, protótipo como referência visual e de organização das páginas, código do site antigo como evidência funcional e levantamento de integração OpenMU. A aplicação será construída do zero. Este documento define o produto; não estabelece fases técnicas, cronograma ou plano de implementação.

## Problem Statement

Jogadores precisam de um portal único para descobrir o servidor, começar a jogar, acompanhar eventos e rankings, administrar sua conta e negociar com segurança. O site atual oferece cadastro, troca de senha, status, jogadores online, top 10 e agenda, mas não atende aos fluxos completos representados no novo protótipo.

O protótipo estabelece a referência visual de UI, cores, interface e organização das páginas. Seu código, modelo de dados e escolhas técnicas não serão reutilizados como base da aplicação nova. Entretanto, contas, saldos, inventário, anúncios, ofertas, pagamentos e publicações são dados simulados no navegador. Esses fluxos não são compartilhados entre jogadores, não comprovam propriedade dos recursos do jogo e não oferecem execução ou recuperação confiável de transações reais.

Os donos do servidor precisam administrar conteúdo, atender relatos de bugs e operar vendas e entregas sem depender de alterações manuais inseguras no banco. Crescimento de acesso ao site não deve comprometer a disponibilidade do jogo nem a consistência de contas, itens e moedas.

## Solution

Construir do zero uma aplicação full stack local orientada aos requisitos deste PRD, usando o protótipo apenas como referência de UI, cores, interface e organização de páginas e preservando as funções atuais do site antigo por meio de integrações a validar. Primeiro, construir frontend, backend e persistência próprios, com simulação do OpenMU e dos serviços externos. Stack, arquitetura, contratos, modelos de dados e regras não são herdados do protótipo; serão avaliados conforme as necessidades da aplicação. Depois, quando a instalação estiver disponível, validar a integração com OpenMU real também localmente. Nenhuma publicação em produção ou cobrança real faz parte desta entrega.

O visitante pode explorar o servidor, notícias, eventos, rankings, catálogo, marketplace e políticas. O jogador autenticado pode consultar a conta e personagens e acompanhar suas interações e relatos. Movimentação de recursos, benefícios, anúncios, ofertas e pagamentos pertencem ao escopo completo futuro e às dependências registradas, sem inclusão automática na primeira entrega. Alteração de nome/classe de personagem não será feita por enquanto. A equipe dispõe das permissões e ferramentas necessárias para publicar conteúdo, moderar interações, tratar incidentes e acompanhar entregas.

Nightmare Coins é um saldo próprio associado ao ecossistema OpenMU, conforme informação do responsável. A confirmação mais recente delimita que compras de cash, vendas de itens e operações que movimentam moeda do jogo ainda não estão integradas. Não presumir que crédito/débito de NC já funciona por existir associação do saldo ao jogo. Precisamos conhecer o contrato e a autoridade de saldo; não presumir equivalência com WCoin nem reconstruir componentes existentes sem investigação.

O sistema diferencia informações públicas, dados privados da conta e operações que alteram o estado do jogo. Pedidos, pagamentos e entregas possuem estados distintos e rastreáveis. Falhas de integração não são apresentadas como sucesso e não permitem duplicação de itens ou crédito.

### Prioridade e dependências confirmadas

Compras e vendas ficam por último, conforme decisão do responsável. Loja, pagamentos e marketplace permanecem no escopo completo do produto, mas sua implementação e validação dependem de operações do lado do jogo que ainda não estão prontas. O responsável esclareceu que a lacuna está nas compras de cash, vendas de itens e operações que movimentam moeda do jogo; não é uma afirmação de falha na conexão básica do cliente MU com OpenMU. Esses fluxos permanecem simulados até a integração específica estar pronta.

Avançar primeiro nos fluxos independentes e no backend/persistência locais. Leituras de status, jogadores, ranking e eventos podem ser simuladas até acesso ao OpenMU real local. Cadastro/senha e ações de personagens, itens, joias, NC ou recompensas que afetem o jogo exigem contratos e validação próprios; sem integração real, sua execução continua explicitamente simulada. Relatos e aprovação de recompensa podem existir antes da entrega de recursos no jogo, que deve permanecer pendente ou simulada.

Nesta etapa não é necessário fechar provedor, comissão ou liquidação comercial. Essas decisões ficam adiadas para a frente de comércio, sem transformar exemplos do mock em regras aprovadas.

### Superfícies do produto

- Home com hero, esteira de notícias, esteira de eventos, campanhas de produtos e promoção do programa de relatos de bugs.
- Header responsivo com navegação, busca, status/rates, idioma, download, comunidade Discord e acesso à conta condicionado à autenticação; footer compartilhado com navegação e políticas.
- Informações do servidor, download e onboarding, cadastro, login, troca de senha e área privada.
- Rankings com busca/filtros, destaque para os cinco primeiros e hierarquia visual para os três primeiros.
- Agenda de eventos com horários reais, duração, próxima execução e contador.
- Notícias em formato de blog com postagens, likes e comentários.
- Loja de moedas, VIP e serviços/pacotes; apoio ao servidor com benefícios explicitados.
- Marketplace com anúncios, filtros avançados, compras, ofertas, transações e configurações de recebimento.
- Cofres do jogo/site, saldos de moedas e joias, personagens, segurança e pagamentos.
- Comunidade, relatos de bugs, recompensas, busca global, regras, reembolso, privacidade, termos e contatos.
- Ferramentas da equipe necessárias para operar esses fluxos; sua interface administrativa específica será detalhada no plano de implementação.

### Como avaliar o resultado

- Todas as funcionalidades atuais do site antigo permanecem disponíveis, inclusive timetable e countdown dos eventos.
- Fluxos locais usam backend e dados persistentes compartilhados entre clientes; fechar o navegador não apaga sua execução.
- A simulação local permite exercitar sucesso, falha e concorrência sem acessar produção, movimentar dinheiro real ou exigir OpenMU real nesta primeira validação.
- Quando OpenMU real local estiver disponível, os mesmos contratos são validados com essa instalação; sucesso na simulação não comprova compatibilidade real.
- Nenhuma operação permite consultar ou alterar recursos de outra conta sem autorização.
- Uma confirmação repetida não duplica entrega; uma disputa simultânea por item tem no máximo um vencedor.
- Pagamento confirmado com entrega pendente continua rastreável e recuperável.
- Navegação pública e privada funciona em desktop e mobile, com teclado, foco visível e movimento reduzido.
- Capacidade de usuários simultâneos, orçamento de latência, disponibilidade e recuperação serão definidos na validação de produto; não há capacidade comprovada pelo protótipo.
- A entrega inclui documentação explícita e atualizada de todas as funcionalidades ausentes, parciais, simuladas e adiadas, com condições para retomada.

## User Stories

### Descoberta, navegação e onboarding

1. Como visitante, quero reconhecer a identidade do Nightmare na home, para entender qual servidor estou acessando.
2. Como visitante, quero ver campanhas no hero com imagens ocupando uma área consistente, para navegar sem mudanças inesperadas no layout.
3. Como visitante, quero acessar os destinos de cada campanha, para realizar a ação anunciada.
4. Como visitante, quero navegar pelas notícias em uma esteira contínua, para descobrir novidades sem depender de um botão de listar todas.
5. Como visitante, quero navegar pelos eventos em uma esteira contínua, para descobrir atividades do servidor.
6. Como visitante, quero ver promoções de produtos em blocos de texto, CTA e imagem, para identificar benefícios e acessar sua oferta.
7. Como visitante, quero conhecer o programa de recompensas por bugs pela home, para reportar problemas pelo canal correto.
8. Como visitante, quero navegar por rankings, eventos, loja e suporte no header, para encontrar os principais destinos rapidamente.
9. Como jogador autenticado, quero acessar opções da minha conta no header, para administrar meus dados sem confundir a navegação pública.
10. Como visitante em dispositivo móvel, quero um menu com todos os destinos relevantes, para acessar o mesmo produto disponível em desktop.
11. Como visitante, quero buscar páginas, notícias e anúncios, para encontrar conteúdo sem conhecer sua localização.
12. Como visitante, quero abrir diretamente um resultado de busca relevante, para chegar ao conteúdo procurado.
13. Como visitante, quero escolher português ou inglês e preservar essa escolha, para utilizar o site no idioma que entendo.
14. Como visitante, quero consultar regras e políticas no footer, para encontrar informações institucionais em qualquer página.
15. Como visitante, quero acessar o Discord oficial, para participar da comunidade.
16. Como visitante, quero consultar versão, experiência, drop e limites oficiais, para avaliar o servidor com dados corretos.
17. Como visitante, quero distinguir servidor online, offline e informação indisponível, para não interpretar falha de consulta como certeza sobre o jogo.
18. Como visitante, quero ver a contagem de jogadores e saber quando ela estiver indisponível, para avaliar atividade sem números fictícios.
19. Como novo jogador, quero seguir um percurso de cadastro, download e instalação, para começar a jogar.
20. Como novo jogador, quero baixar o cliente real e consultar requisitos aprovados, para preparar meu computador.

### Identidade e conta

21. Como visitante, quero criar uma conta com nome, e-mail, senha, confirmação e PIN, para utilizar o servidor e o portal.
22. Como visitante, quero receber validações claras sobre campos inválidos ou nome ocupado, para corrigir meu cadastro.
23. Como visitante, quero conhecer e aceitar os termos aplicáveis ao cadastro, para compreender as condições do serviço.
24. Como novo jogador, quero saber se o cadastro foi concluído e qual é o próximo passo, para não presumir uma sessão que não existe.
25. Como jogador, quero entrar com minha identidade de conta do jogo, para acessar os recursos privados associados a ela.
26. Como jogador, quero retornar ao destino solicitado após autenticar, para continuar uma compra ou outra ação.
27. Como jogador, quero sair da conta e encerrar a sessão, para proteger meus dados em computadores compartilhados.
28. Como jogador, quero que sessões expiradas e contas bloqueadas sejam tratadas claramente, para entender quando o acesso não está permitido.
29. Como jogador, quero trocar minha senha validando a senha atual e a confirmação da nova, para proteger minha identidade.
30. Como jogador, quero que senhas e PIN não sejam exibidos ou persistidos como dados públicos do navegador, para preservar minhas credenciais.
31. Como jogador, quero consultar meu e-mail e a indicação de PIN cadastrado, para conferir as informações de segurança disponíveis.
32. Como jogador, quero visualizar meus saldos e meu VIP na área de conta, para entender os recursos e benefícios disponíveis.
33. Como jogador, quero ver todos os saldos de joias, para planejar minhas negociações.
34. Como jogador, quero abrir a conta em outro dispositivo e encontrar os mesmos dados, para não depender de armazenamento local.
35. Como jogador, quero receber tratamento claro de carregamento, vazio e erro na área privada, para distinguir indisponibilidade de ausência de recursos.

### Cofres e personagens

36. Como jogador, quero consultar separadamente o cofre do jogo e o cofre do site, para identificar onde meus itens estão disponíveis.
37. Como jogador, quero visualizar os atributos reais dos itens, para decidir uso e negociação.
38. Como jogador, quero transferir um item elegível do jogo para o site, para anunciá-lo sem manter uma cópia utilizável no jogo.
39. Como jogador, quero transferir um item do site para o jogo, para utilizá-lo no personagem.
40. Como jogador, quero conhecer condições que bloqueiam uma transferência, para resolver conexão ativa, item reservado ou falta de espaço.
41. Como jogador, quero acompanhar transferência pendente ou com falha, para saber se posso repetir ou procurar suporte.
42. Como jogador, quero que repetir um pedido de transferência não duplique o item, para preservar a consistência de meu inventário.
43. Como jogador, quero acessar a criação de anúncio a partir de um item no cofre do site, para negociá-lo.
44. Como jogador, quero listar meus personagens com nome, classe, nível e resets, para conferir sua evolução.
45. Como jogador, quero que alterações de nome e classe não sejam oferecidas como serviço disponível nesta entrega, para não receber promessa de uma operação ainda não implementada.
46. Como responsável pelo produto, quero registrar a alteração de nome/classe como funcionalidade adiada, para reavaliar regras, custos e compatibilidade quando seu escopo for retomado.
47. Como jogador, quero que não haja cobrança ou mudança de saldo por um serviço de personagem adiado, para preservar meus recursos.
48. Como jogador, quero controlar a visibilidade das informações permitidas do personagem, para administrar minha exposição pública.

### Rankings e eventos

49. Como visitante, quero consultar um ranking com dados reais e critério de classificação definido, para comparar os personagens.
50. Como visitante, quero buscar um personagem e filtrar por classe, para encontrar resultados relevantes.
51. Como visitante, quero que filtros preservem a posição global quando essa for a regra do ranking, para interpretar corretamente os destaques.
52. Como visitante, quero distinguir visualmente os cinco primeiros e a hierarquia dos três primeiros, para reconhecer os líderes.
53. Como visitante, quero consultar informações públicas autorizadas de um personagem selecionado, para conhecer seu perfil.
54. Como visitante, quero saber quando o ranking estiver vazio ou indisponível, para não confundir erro com ausência de jogadores.
55. Como visitante, quero consultar todos os eventos publicados e elegíveis, para planejar minha participação.
56. Como visitante, quero ver os horários recorrentes, duração e próxima execução de cada evento, para organizar minha sessão.
57. Como visitante, quero ver horários com fuso explícito, para evitar diferenças entre meu navegador e o servidor.
58. Como visitante, quero um contador baseado na próxima execução, para saber quanto falta mesmo depois de deixar a aba em segundo plano.
59. Como visitante, quero ver multiplicadores específicos quando existirem, para não presumir benefícios iguais em todos os eventos.
60. Como visitante, quero distinguir programação prevista de execução confirmada, para interpretar corretamente o status do evento.

### Loja, apoio, pedidos e benefícios

61. Como visitante, quero explorar moedas, VIP e serviços/pacotes, para conhecer as ofertas do servidor.
62. Como visitante, quero filtrar produtos e abrir uma promoção específica, para encontrar a oferta anunciada.
63. Como comprador, quero ver preço, quantidade, duração e benefícios antes de comprar, para entender o que receberei.
64. Como comprador, quero autenticar antes de concluir uma compra, para associar a entrega à conta correta.
65. Como comprador, quero criar um pedido com identificação e valores fixados, para acompanhar exatamente a oferta contratada.
66. Como comprador, quero obter instruções de pagamento e copiar o código PIX quando disponível, para concluir a cobrança.
67. Como comprador, quero consultar o prazo de pagamento, para saber até quando a cobrança/reserva está válida.
68. Como comprador, quero que a confirmação venha do provedor validado pelo backend, para não depender de um botão no navegador.
69. Como comprador, quero distinguir pagamento pendente, confirmado e entrega pendente/concluída, para entender o andamento real.
70. Como comprador, quero consultar meu histórico e reabrir pedidos, para acompanhar compras depois de fechar a página.
71. Como comprador, quero cancelar um pedido elegível ou ver sua expiração, para encerrar tentativas não pagas.
72. Como comprador, quero receber moedas ou benefícios apenas uma vez, para evitar inconsistências por notificações repetidas.
73. Como comprador, quero acompanhar uma falha de entrega mesmo após pagar, para receber recuperação ou atendimento.
74. Como comprador, quero solicitar revisão/reembolso conforme a política aprovada, para resolver problemas sem alterar pagamentos por conta própria.
75. Como jogador, quero comprar VIP e visualizar sua validade e benefícios, para planejar seu uso.
76. Como jogador, quero conhecer a regra de renovação e troca de VIP antes da recompra, para entender como o prazo será aplicado.
77. Como jogador, quero comprar os pacotes de joias aprovados com NC, para abastecer meu saldo/inventário conforme a oferta.
78. Como apoiador, quero escolher um valor de apoio e conhecer previamente a contrapartida, para contribuir com o servidor.
79. Como apoiador, quero utilizar somente formas de pagamento realmente disponíveis, para não receber uma promessa sem integração.

### Marketplace e recebimentos

80. Como visitante, quero explorar anúncios de itens disponíveis, para conhecer o mercado antes de autenticar.
81. Como comprador, quero buscar por item e vendedor e filtrar categoria, moeda, preço e nível, para encontrar ofertas adequadas.
82. Como comprador, quero filtrar Excellent, luck, skill, ancient, socket, opções Excellent e aceitação de ofertas, para avaliar atributos específicos.
83. Como comprador, quero ordenar e paginar resultados com regras monetárias coerentes, para comparar anúncios sem misturar unidades incompatíveis.
84. Como comprador, quero abrir os detalhes do item, preço, vendedor e condições, para decidir a compra.
85. Como vendedor, quero anunciar somente itens elegíveis que possuo no cofre do site, para oferecer recursos realmente disponíveis.
86. Como vendedor, quero definir moeda, preço e eventual composição de joias, para estabelecer as condições de venda.
87. Como vendedor, quero decidir se aceito ofertas e em quais moedas, para controlar minha negociação.
88. Como vendedor, quero que o item anunciado permaneça reservado fora de uso, para não vender um recurso já consumido ou transferido.
89. Como vendedor, quero consultar e cancelar meus anúncios elegíveis, para recuperar o item quando não houver compromisso ativo.
90. Como comprador, quero comprar com NC ou joias disponíveis, para receber o item após liquidação válida.
91. Como comprador, quero que apenas um comprador conclua a aquisição de um item, para não pagar por um recurso indisponível.
92. Como comprador, quero receber no cofre do site o item adquirido, para decidir depois seu uso ou revenda.
93. Como comprador, quero que compra do próprio anúncio seja recusada, para preservar as regras do mercado.
94. Como comprador, quero enviar uma oferta em moeda aceita pelo vendedor, para negociar condições diferentes do anúncio.
95. Como vendedor, quero consultar, aceitar ou recusar ofertas sobre meus anúncios, para concluir negociações de forma controlada.
96. Como negociador, quero conhecer o estado e o resultado de cada oferta, para não presumir uma compra quando ainda falta pagamento.
97. Como comprador em reais, quero reservar o item exclusivamente durante o pagamento por um prazo configurável, inicialmente de 15 minutos nos testes locais, para concluir a compra sem disputa com outro comprador.
98. Como vendedor, quero ver uma reserva ser liberada após cancelamento/expiração válida, para negociar novamente sem perder o item.
99. Como vendedor, quero configurar e acompanhar meu meio de recebimento, para habilitar vendas em reais conforme a regra aprovada.
100. Como vendedor, quero conhecer preço bruto, comissão e valor líquido antes da venda, para compreender o recebimento.
101. Como comprador e vendedor, quero consultar transações com valores, participantes, item e data, para ter comprovação da negociação.
102. Como comprador e vendedor, quero acompanhar contestação ou falha de liquidação, para resolver o problema sem duplicação ou retirada arbitrária de recursos.

### Notícias, comunidade e relatos

103. Como visitante, quero explorar notícias em um feed de blog com categoria, capa, autoria e data, para acompanhar o servidor.
104. Como visitante, quero abrir uma postagem por endereço permanente, para ler e compartilhar seu conteúdo.
105. Como dono/editor autorizado, quero criar e editar título, resumo, categoria, imagem e conteúdo, para publicar novidades.
106. Como dono/editor autorizado, quero preservar interações válidas ao editar uma postagem, para não apagar a participação da comunidade.
107. Como jogador autenticado, quero curtir e retirar minha curtida, para expressar interesse sem criar múltiplos votos da mesma conta.
108. Como jogador autenticado, quero comentar uma postagem, para participar da discussão.
109. Como jogador autenticado, quero remover meus comentários permitidos, para controlar minha participação.
110. Como moderador autorizado, quero remover conteúdo inadequado com registro de autoria da ação, para manter a comunidade organizada.
111. Como jogador, quero que publicação e moderação dependam de permissões reais, para confiar na autoria das notícias e nas intervenções da equipe.
112. Como jogador autenticado, quero relatar um problema com título, passos para reproduzir e impacto, para ajudar a equipe a corrigi-lo.
113. Como relator, quero receber um protocolo e acompanhar apenas os relatos aos quais tenho acesso, para consultar seu andamento com privacidade.
114. Como relator, quero entender elegibilidade e condições de recompensa, para reportar sem explorar a falha.
115. Como equipe de suporte, quero consultar, classificar e tratar relatos, para organizar problemas por impacto.
116. Como equipe de suporte, quero registrar análise e resolução, para manter histórico do atendimento.
117. Como equipe autorizada, quero aprovar uma recompensa e acompanhar sua entrega, para reconhecer relatos válidos sem duplicar créditos.

### Operação, qualidade e continuidade

118. Como dono do servidor, quero manter rates, links oficiais e ofertas consistentes entre páginas, para evitar informações contraditórias.
119. Como admin, quero acessar os painéis administrativos por minha role verificada no backend, para operar o portal sem depender de um nome especial de conta.
120. Como operador, quero auditar alterações de saldo, itens, personagens, pagamentos e permissões, para investigar problemas.
121. Como operador, quero localizar operações pendentes ou com falha e reprocessá-las sem duplicação, para recuperar a execução.
122. Como operador, quero testar pagamentos e integração OpenMU em ambiente local/homologação, para validar fluxos sem afetar produção.
123. Como operador, quero simulação e integração real compatíveis com contratos e testes comuns, para reduzir diferenças entre ambientes.
124. Como jogador, quero continuar jogando durante picos de navegação no site, para não sofrer com trabalho repetido de consultas públicas.
125. Como operador, quero medir carga, latência, falhas e estado das integrações, para avaliar capacidade e disponibilidade.
126. Como usuário, quero utilizar os fluxos em telas pequenas e com teclado, para acessar o produto sem barreiras de navegação.
127. Como usuário sensível a movimento, quero controlar ou reduzir animações e esteiras, para navegar confortavelmente.
128. Como usuário, quero receber mensagens claras de loading, sucesso, validação e falha, para entender o resultado de cada ação.
129. Como usuário, quero acessar links diretamente e recarregar páginas sem perder sua localização, para navegar de forma previsível.
130. Como operador, quero recuperar dados e operações após uma falha de infraestrutura, para preservar contas, compras e negociações.

### Autenticação completa e administração confirmadas

131. Como jogador, quero receber um link de verificação de e-mail e solicitar reenvio, para confirmar meu endereço de contato.
132. Como jogador, quero recuperar minha senha por um link temporário de uso único, para voltar a acessar a conta sem saber a senha atual.
133. Como jogador, quero que links expirados, já usados ou inválidos sejam recusados claramente, para não alterar minha conta com uma autorização antiga.
134. Como jogador, quero encerrar sessões e ter acesso revogado após eventos de segurança definidos, para proteger a conta.
135. Como jogador, quero receber tratamento consistente para tentativas inválidas e limites de autenticação, para utilizar um serviço protegido contra abuso.
136. Como operador local, quero inspecionar e testar mensagens de verificação e recuperação em um simulador de e-mail, para validar autenticação sem enviar mensagens reais.
137. Como visitante, quero cadastrar livremente uma conta player, para entrar sem precisar da criação manual de um admin.
138. Como operador autorizado, quero criar uma ou mais contas admin por script, para disponibilizar acesso administrativo sem uma opção pública de elevação.
139. Como admin, quero um acesso claro à área administrativa separado da navegação do player, para encontrar as ferramentas de gestão.
140. Como admin, quero consultar jogadores e seus estados de acesso, para administrar contas dentro das permissões e ações disponibilizadas.
141. Como admin, quero administrar notícias e moderar comentários, para operar o blog sem usar a conta demo como autorização.
142. Como admin, quero consultar todos os reports, analisar impacto, registrar andamento e aprovar ou recusar recompensas, para atender os jogadores.
143. Como player, quero consultar somente meus reports e informações privadas, para preservar confidencialidade entre contas.
144. Como admin, quero administrar configurações e conteúdos oficiais do portal, para manter links, informações públicas e campanhas consistentes.
145. Como operador, quero registrar a criação de admins e ações administrativas sensíveis, para identificar quem realizou cada alteração.

## Implementation Decisions

### Requisitos estabelecidos pela conversa e referência visual

- Construir uma aplicação nova do zero. O protótipo é exclusivamente referência visual de UI, cores, interface e organização de páginas; sua implementação não será utilizada como aplicação-base nem transplantada para o novo projeto.
- O código antigo é evidência de comportamentos e integrações existentes, não decisão automática de reutilização de backend.
- O Fortnite inspira composição e hierarquia, com identidade própria do MU Nightmare.
- Manter a qualidade e a intenção visual de componentização, responsabilidades separadas, tipografia, espaçamento padronizado e alinhamentos consistentes. React, shadcn, Tailwind e demais tecnologias usadas na demo não são escolhas obrigatórias para a aplicação nova; a seleção da stack e biblioteca de UI será justificada pelos requisitos.
- Manter header e footer compartilhados; opções privadas aparecem somente em sessão autenticada. Políticas ficam no footer e não ocupam a navegação principal.
- Não expor catálogo de componentes, rotas de desenvolvimento ou controles de simulação na experiência pública de produção.
- Preservar os cards de notícias da home; a página de notícia é um blog. Notícias/eventos na home usam esteiras contínuas com interação acessível e movimento reduzido.
- Preservar hero com enquadramento estável e campanhas em blocos alternados de texto/CTA e imagem. Conteúdo promocional deve apontar para produtos/fluxos existentes.
- Não introduzir eyebrows ou subtítulos genéricos explicando toda página. Descrições funcionais/produto, condições comerciais e mensagens necessárias continuam disponíveis.
- Preservar cadastro, troca de senha, status, jogadores, ranking e agenda do site antigo. A nova apresentação de eventos precisa incluir as informações reais que o mock ainda não contém.
- Sessão web é distinta da sessão do jogo. Criação de conta não equivale automaticamente a login web.
- Backend deve ser a autoridade de identidade, permissão, propriedade, saldo, preço, reserva, pagamento e entrega. O estado local do navegador não aprova operações de produção.
- Consultas públicas podem usar dados atualizados periodicamente, identificando indisponibilidade ou atraso quando necessário. Dados privados não podem vazar entre usuários por cache.
- Credenciais de integração OpenMU/provedor ficam no backend e não são distribuídas com o React.
- Dados e ações do jogo são executados por integração compatível com a versão/fork instalado. Escrita direta em tabelas não é considerada, isoladamente, garantia de sincronização com jogador conectado.
- Contratos da integração simulada e real devem ter as mesmas entradas, resultados, erros de negócio e garantias verificáveis. Cada integração real também exige testes específicos de infraestrutura/estado online.
- Operações repetíveis usam identificadores estáveis; concorrência não pode duplicar itens, reservas, débito ou crédito.
- Pedido, pagamento e entrega são conceitos separados. Pagamento aprovado com falha de entrega continua registrado e recuperável; um pedido expirado não resolve sozinho um pagamento recebido depois.
- Histórico monetário deve distinguir moeda do jogo, joias e valores em reais; valores de moedas diferentes não são comparados diretamente como um preço único.
- Política de privacidade, reembolso, termos e contatos precisa corresponder ao serviço real; textos de demonstração não se tornam políticas aprovadas automaticamente.

### Autorização e autenticação confirmadas

- Existem exatamente duas roles autenticadas nesta entrega: `player` e `admin`. Visitante é ausência de sessão, não uma terceira role autenticada. Editors, moderadores e suporte não terão roles separadas por enquanto; essas funções pertencem ao admin.
- Cadastro público cria exclusivamente player; campos enviados pelo cliente não podem atribuir ou elevar role. Uma ou mais contas admin são criadas por script operacional, fora do cadastro público e sem senha padrão exposta. O script é requisito futuro; não foi implementado durante a redação deste PRD.
- Admin possui acesso a todos os painéis administrativos do portal: conteúdo/notícias, moderação, reports/recompensas, contas e configurações. Painéis de comércio dependem da frente comercial posterior. Admin do portal não equivale automaticamente a administrador da infraestrutura ou do painel OpenMU.
- Área player mantém conta, personagens/recursos elegíveis, interações e reports próprios. Admin tem acesso à navegação de jogador e uma entrada separada para administração. Autorizações são verificadas por operação no backend, não apenas escondendo botões.
- Reports exigem login. Player consulta seus protocolos; admin consulta todos, registra análise e decide recompensa. Aprovação administrativa é diferente de entrega de moeda/item: entrega permanece simulada ou pendente enquanto a integração correspondente não estiver pronta.
- Autenticação completa inclui cadastro, validação/verificação de e-mail com reenvio, login, logout, sessão persistente com expiração/revogação, troca de senha e recuperação por token temporário de uso único. Política exata de duração e exigência da verificação para cada ação será estabelecida no detalhamento dos contratos.
- Mensagens de e-mail são capturadas em simulador local, sem envio externo real. Testar contas bloqueadas, erros de credencial, abuso, expiração e revogação; mudanças de senha precisam manter compatibilidade com identidade OpenMU quando integrada.
- Não entregar senha/PIN/hash nem tokens de recuperação como dados de conta para o frontend. MFA/2FA ainda não está explicitamente aprovado e não é considerado decidido apenas pela expressão autenticação completa.

### Escolhas técnicas abertas, a avaliar antes do plano

- Domínios: identidade, informações públicas, conteúdo/comunidade, suporte/recompensas, conta/recursos do jogo, catálogo/benefícios, pagamentos/pedidos, marketplace e operação administrativa.
- Monólito modular é uma opção discutida, não uma arquitetura já escolhida. Avaliar organização e implantação conforme consistência, integração OpenMU, carga, manutenção e experiência de desenvolvimento local.
- Avaliar APIs disponíveis na versão/fork do OpenMU e integrações existentes como dependências externas. Não presumir reaproveitamento da aplicação .NET antiga. Novas capacidades exigem contrato/adaptador/extensão validada; decisão depende das operações necessárias e da instalação.
- Dados próprios do portal têm persistência separada logicamente dos dados oficiais do jogo. Identidade é vinculada de forma estável à conta OpenMU.
- Conteúdo estático pode ser servido por CDN; leituras públicas compartilhadas usam cache; integração não consulta o jogo de novo para cada visitante sem necessidade.
- Sessões, limites e reservas devem manter comportamento coerente em múltiplas instâncias; regras críticas não dependem apenas da memória de um processo.
- Escolher do zero linguagem e frameworks de frontend/backend, biblioteca de UI, persistência, autenticação, tarefas, cache, observabilidade e testes, com justificativa para o caso específico. Compatibilidade com OpenMU não obriga automaticamente nosso backend a usar a mesma linguagem.
- Não definir neste PRD schemas finais, URLs novas de API, pacotes, topologia de infraestrutura ou fases de entrega. Eles pertencem à avaliação técnica e ao plano posterior, após validar o produto.

### Registro de decisões — confirmadas e pendentes

1. **Escopo confirmado:** todos os fluxos serão desenvolvidos e testados localmente, inicialmente com OpenMU simulado e depois com OpenMU real local quando disponível. Não há entrega em produção nesta iniciativa; decisões de publicação serão objeto de escopo posterior.
2. **Nightmare Coins confirmado:** saldo próprio associado ao OpenMU. A clarificação posterior informa que operações que movimentam moeda do jogo ainda não estão integradas. Falta acesso ao código/contrato para distinguir capacidades existentes e pendentes. Crédito/débito, transferência, conversão e saque não são presumidos como disponíveis.
3. **Vendas em reais — decisão adiada:** compras e vendas ficam por último, por dependência de operações ainda não prontas do lado do jogo. A reserva exclusiva está confirmada, com prazo configurável e valor inicial de 15 minutos nos testes locais. Provedor, vínculo de vendedor, beneficiário, comissão e confirmação tardia serão definidos ao retomar comércio; 5% não está aprovado.
4. **Taxas em moedas/joias:** o mock desconta 5% também de NC/joias e arredonda para baixo; confirmar se haverá comissão nessas moedas, destino e arredondamento. Essa regra não deve ser aprovada implicitamente.
5. **Catálogo e apoio:** confirmar preços, bônus e contrapartida. O mock apresenta pacotes de 1.000/2.200 NC, VIP de 30 dias, 40 NC por real em apoio e joias por 300 NC; valores são exemplos não aprovados.
6. **VIP:** confirmar benefícios reais, combinação de planos, renovação, troca e comportamento após expiração/reembolso. Somar prazo do mesmo plano é comportamento observado no mock, não regra final.
7. **Serviços de personagens adiados:** não implementar mudança de nome/classe por enquanto. Não herdar o custo de 200 NC do protótipo. Registrar ausência no documento final de pendências. Consulta de personagens continua prevista; alcance da ocultação de informações permanece a esclarecer.
8. **Cofres e banco de joias:** confirmar recursos negociáveis, capacidades, condições de transferência e se joias são saldo virtual, itens físicos ou ambos. O mock não possui depósito/saque de joias implementado.
9. **Ofertas:** confirmar se aceitar uma oferta em NC/joias liquida imediatamente, se saldo será reservado ao ofertar e quais são validade/cancelamento de ofertas. O mock não reserva saldo ao enviar oferta.
10. **Reembolso/contestação:** definir quem solicita/aprova, como tratar benefícios consumidos ou item já transferido/negociado e recebimento do vendedor. Botões de estorno da demo não são permissão do comprador em produção.
11. **Reports confirmado:** exigem login; player consulta seus protocolos e admin analisa e aprova/recusa recompensas. Interação/anexos, estados e valores/formas de recompensa ainda precisam de detalhamento. Entrega de recurso do jogo depende da integração posterior.
12. **Administração confirmada:** somente player e admin; múltiplos admins criados por script. Admin concentra painéis administrativos, notícias, moderação e atendimento. Detalhar ações sensíveis e regras de remoção; comércio fica para depois.
13. **Identidade confirmada:** autenticação completa com verificação de e-mail, recuperação, sessões e troca de senha, além de cadastro/login/logout. E-mail simulado localmente. MFA/2FA não foi explicitamente definido; durações e restrições por estado serão detalhadas.
14. **Ranking e eventos:** definir abrangência de busca além do top 10, perfis públicos/visibilidade, desempates, fonte de eventos adicionais e timezone oficial.
15. **Dados oficiais:** aprovar rates, limites, links e requisitos reais; código antigo e novo apresentam valores diferentes.
16. **Idiomas:** protótipo oferece PT/EN; antigo oferece EN/PL. Confirmar se polonês permanece e como preferência visual se relaciona com idioma da conta no jogo.
17. **Escala:** definir público esperado, pico de usuários/ações simultâneas, metas de latência/disponibilidade e tolerância de atraso de dados públicos. “Milhares” ainda não estabelece um requisito de capacidade mensurável.

## Out of Scope

- Reutilização da aplicação do protótipo como base de código, migração de seus reducers/localStorage/modelos ou adoção automática de sua stack.
- Alteração de nome/classe de personagem nesta entrega; custo do mock não é requisito aprovado.
- Publicação, implantação em produção, acesso ao banco de produção ou movimentação de dinheiro real.
- Plano de implementação, sequência de sprints, estimativas, schema detalhado e contratos finais de endpoints novos.
- Reescrever cliente MU, implementar protocolo de combate ou substituir o OpenMU.
- Alterar balanceamento/regras de combate, criar classes ou inventar eventos sem requisito aprovado.
- Considerar login web e sessão do jogo como a mesma sessão.
- Colocar credenciais OpenMU ou segredos de pagamento no frontend.
- Preservar atalhos de demo como aprovação manual de pagamento pelo comprador, contas/senhas seedadas ou permissões pelo nome `demo` em produção.
- Adotar microserviços como exigência automática, sem necessidade demonstrada.
- Adicionar venda de personagens, leilões, aplicativo móvel nativo, chat em tempo real ou moedas externas não representados no protótipo, sem revisão de escopo.
- Presumir suporte a cartão/boleto apenas porque aparecem no seletor demonstrativo; sua inclusão depende de decisão sobre meios de pagamento.
- Fixar como definitivos taxas, preços, benefícios, políticas ou dados do servidor que hoje são exemplos.

## Further Notes

### Ambientes e simulação

A primeira entrega é full stack local: frontend chama o nosso backend; o backend persiste os dados e usa um adaptador OpenMU simulado, além de simuladores dos serviços externos. Controles para provocar pagamento/falha podem existir no ambiente de testes, separados das permissões do comprador. Em seguida, o adaptador real será validado com OpenMU local quando o responsável disponibilizar acesso. Requisitos que mencionam produção descrevem garantias desejadas do produto futuro, não autorização para publicar ou cobrar nesta entrega.

Reserva de checkout e reserva de anúncio são diferentes. O item anunciado já precisa ficar indisponível para uso/transferência no jogo. Durante um checkout, pode haver uma reserva adicional exclusiva para aquele comprador. A exclusividade durante o pagamento está aprovada, com prazo configurável e valor inicial de 15 minutos nos testes locais. O instante de expiração é controlado pelo backend e deve permanecer consistente após fechar o navegador, recarregar a página ou trocar de cliente; o contador da UI apenas apresenta esse prazo. Expiração visual não comprova cancelamento de cobrança e confirmação tardia exige regra específica.

### Evidência e interpretação

As histórias registram funcionalidades discutidas e condições necessárias para um serviço real; não fazem dos comportamentos internos do protótipo regras automaticamente aprovadas. Decisões explícitas posteriores, em especial construção do zero e funcionalidades adiadas, prevalecem sobre exemplos da demo. Ferramentas operacionais, autorização no backend, rastreabilidade e recuperação são requisitos para operar esses fluxos, embora a demo não possua telas completas para eles.

O código do site antigo implementa cinco páginas e seis endpoints. Isso não significa que a instalação OpenMU ofereça apenas essas capacidades. O upstream oficial atual tem APIs de status, conta online, cadastro e cash shop, mas sua disponibilidade e compatibilidade na instalação Nightmare ainda não foram confirmadas.

As decisões pendentes são parte da entrevista do PRD. Antes de marcar este documento como aprovado, registrar as respostas e atualizar histórias, condições e escopo; nenhuma resposta será inferida como aprovada apenas por existir no mock.

### Entrega obrigatória de documentação de pendências

Ao final de cada entrega de implementação, produzir e atualizar um documento que enumere tudo que falta em relação ao PRD. Essa documentação integra os critérios de conclusão, mesmo quando há recursos deliberadamente adiados.

Para cada pendência, registrar: funcionalidade/garantia ausente, estado (adiada, não implementada, parcial, simulada, bloqueada por dependência ou aguardando decisão), o que funciona de fato, limitação observável, motivo, dependência necessária, evidência/testes disponíveis e condição para retomada. Não declarar uma integração real concluída com base apenas em simulador.

Incluir, no mínimo, alteração de nome/classe, integrações monetárias, comércio, pagamentos reais, operações do jogo ainda simuladas, decisões em aberto e diferenças funcionais em relação ao site antigo. Documentar também lacunas técnicas identificadas durante a implementação, sem escondê-las em comentários do código ou apenas na conversa. Esse documento deve ser entregue com localização clara junto à aplicação nova; sua estrutura técnica será definida no plano.

### Casos que precisam de aceitação explícita

- Pagamento duplicado, notificação fora de ordem, confirmação depois da expiração e pagamento confirmado com OpenMU indisponível.
- Dois compradores no mesmo item, cancelamento concorrente com pagamento e oferta aceita sem saldo suficiente.
- Transferência enquanto a conta conecta, inventário sem espaço, timeout após execução e reinício durante operação.
- VIP diferente do atual, recompra, expiração e estorno com benefício já utilizado.
- Mudança de nome ocupado, mudança de classe incompatível e insuficiência de saldo.
- Conta bloqueada ou sessão expirada em uma operação, edição não autorizada e vazamento por cache/busca.
- Evento inválido sem derrubar toda a agenda, timezone divergente e contador após suspensão de aba.
- Busca de ranking com posição global preservada e conteúdo oculto respeitado em todas as superfícies.
- Report privado, moderação rastreável e recompensa concedida uma única vez.

Esses casos serão convertidos em critérios detalhados de aceitação após as decisões de produto e, depois, em testes no plano de implementação.
