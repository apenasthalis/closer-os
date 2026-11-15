# PROMPT MASTER — CLOSER OS PRO
## Reprodução fiel do HTML + aplicação completa com React, Vite, Laravel e MySQL

Você é um engenheiro de software sênior, arquiteto full-stack e especialista em reprodução fiel de interfaces web.

Sua missão é desenvolver o **Closer OS Pro**, transformando o arquivo HTML de referência anexado em uma aplicação web real, completa, funcional, persistente e pronta para uso.

O projeto deve ter frontend e backend separados:

- `frontend/`: React + Vite + TypeScript.
- `backend/`: Laravel 12 + PHP 8.3.
- Banco de dados: MySQL 8.
- Comunicação: API REST.
- Autenticação: Laravel Sanctum.

**REGRA PRINCIPAL: A INTERFACE PRECISA SER VISUALMENTE FIEL AO HTML ANEXADO.**

Não quero uma releitura, uma versão modernizada, uma inspiração ou uma interface parecida. Quero a reprodução mais próxima possível do HTML original, respeitando todos os detalhes visuais e comportamentais.

---

# 1. REGRA INEGOCIÁVEL: LEITURA E AUDITORIA DO HTML

Antes de escrever qualquer código:

1. Leia integralmente o arquivo `Closer OS Pro completo.html`.
2. Analise todo o CSS, HTML, JavaScript, textos, componentes, estados, funções, eventos e comportamentos.
3. Identifique todos os módulos, telas, modais, botões, filtros, formulários, gráficos, indicadores e interações.
4. Identifique as dimensões, espaçamentos, cores, tipografia, bordas, raios, sombras, alinhamentos e breakpoints responsivos.
5. Crie o documento `docs/REFERENCE_AUDIT.md`, registrando a estrutura original e como cada elemento será reproduzido no React.

Não comece a implementação sem concluir essa auditoria.

O HTML anexado é a referência visual e funcional principal. Você deve utilizá-lo durante todo o desenvolvimento, consultando-o sempre que houver dúvida sobre aparência, estrutura ou comportamento.

**Não descarte elementos do HTML por considerar que são pequenos, secundários ou desnecessários.**

Não simplifique a interface.

Não substitua componentes por versões genéricas.

Não troque os textos por textos inventados.

Não reorganize as telas por preferência pessoal.

Não altere a identidade visual.

Se uma biblioteca gerar um componente visual diferente do original, personalize-o até reproduzir o padrão do HTML.

## 1.1 Hierarquia de decisões

Existem duas fontes de referência:

- O HTML anexado determina a aparência, a estrutura visual, os textos, a organização e os comportamentos de interface.
- As regras de negócio descritas neste prompt determinam o funcionamento financeiro, comercial, administrativo e operacional.

Quando houver conflito entre uma regra antiga embutida no JavaScript do HTML e uma regra de negócio deste prompt, siga este prompt.

Exemplos de regras antigas do protótipo que não devem ser preservadas:
- O login simulado deve ser substituído por autenticação Laravel real.
- O armazenamento local ou Firebase do protótipo deve ser substituído pela API Laravel e pelo MySQL.
- A modalidade Contrato não deve existir na versão final.
- A taxa de gateway do cartão não deve ser calculada nem descontada.
- Os dados de demonstração não devem ser confundidos com dados reais.

A aparência original, porém, deve permanecer fiel.

---

# 2. FIDELIDADE VISUAL: REPRODUZIR O HTML, NÃO REDESENHAR

Esta é uma das partes mais importantes do projeto.

A interface precisa preservar o mesmo design do arquivo de referência.

## 2.1 Cores oficiais

Utilize os tokens originais do HTML:

```css
:root {
  --bg: #070a08;
  --surface: #0e1311;
  --raise: #151c18;
  --line: #212b26;

  --fg: #f1f6f3;
  --muted: #8c9a92;

  --accent: #1ed760;
  --accent-text: #1ed760;
  --accent-ink: #03130a;
  --accent-soft: rgba(30, 215, 96, .12);

  --warn: #f2b441;
  --crit: #ff6159;
  --info: #58b4ff;

  --warn-soft: rgba(242, 180, 65, .14);
  --crit-soft: rgba(255, 97, 89, .14);
  --info-soft: rgba(88, 180, 255, .14);

  --scrim: rgba(0, 0, 0, .66);

  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --u: 1px;
  --sw: calc(var(--u) * 248);

  color-scheme: dark;
}
```

Não escolha outras tonalidades de verde.

Não substitua o fundo por preto absoluto.

Não transforme os cards em superfícies claras.

Não use gradientes novos ou efeitos decorativos que não existam no original.

Preserve o contraste, as cores de status e as variações de superfície.

## 2.2 Tipografia

Utilize exatamente:

- **Space Grotesk:** títulos, indicadores numéricos e elementos de destaque.
- **Inter:** textos, descrições, formulários, tabelas, botões e navegação.

Carregue as fontes do Google Fonts, respeitando os pesos utilizados no HTML.

Não substitua por Arial, Roboto ou outra fonte.

Preserve:
- Pesos tipográficos.
- Tamanhos.
- Altura de linha.
- Espaçamento entre letras.
- Transformações em maiúsculas.
- Alinhamentos.
- Números tabulares (`tabular-nums`).

## 2.3 Layout e dimensões

Reproduza a estrutura original:

- Sidebar fixa à esquerda em telas grandes.
- Largura original de 248px, respeitando o sistema de escala do HTML.
- Área principal à direita.
- Largura máxima de conteúdo.
- Padding externo.
- Espaçamento entre seções.
- Cards com bordas discretas.
- Bordas e raios originais.
- Botões primários e secundários.
- Campos de formulário.
- Badges e indicadores.
- Tabelas e gráficos.
- Modais sobrepostos à aplicação.

Preserve a hierarquia e as proporções entre os elementos.

## 2.4 Componentes visuais

Reproduza fielmente:

- Logo CO e identificação Closer OS PRO.
- Ícones SVG e seus traços.
- Navegação lateral.
- Item ativo da navegação.
- Grupos e separadores.
- Cards de indicadores.
- Cards do Kanban.
- Colunas e títulos do pipeline.
- Barras de progresso.
- Chips e pills.
- Estados de alerta.
- Campos e selects.
- Botões.
- Tabelas.
- Gráficos.
- Anéis de pontuação.
- Heatmap de calls.
- Timeline.
- Modais.
- Toasts.
- Tela de login.
- Estados vazios.
- Estados de carregamento.

Não use emojis no lugar dos ícones SVG originais.

Não substitua o design por componentes prontos do shadcn/ui sem personalização. Você pode utilizar Radix ou outras bibliotecas internamente, mas o resultado visual precisa corresponder ao HTML.

## 2.5 Responsividade

Reproduza os breakpoints do HTML:

- Acima de 2000px: escala de interface `1.1`.
- Acima de 2400px: escala `1.25`.
- Acima de 3000px: escala `1.6`.
- Até 1179px: sidebar compacta, conforme o original.
- Até 860px: sidebar horizontal com abas roláveis, conteúdo adaptado e Kanban com rolagem horizontal.

Preserve também:
- Safe areas em dispositivos móveis.
- Navegação adaptada.
- Cards reorganizados.
- Formulários sem estouro.
- Modais responsivos.
- Rolagem horizontal apenas onde o original prevê.
- Área de conteúdo sem rolagem horizontal indevida.

A interface deve funcionar em desktop, notebook, tablet e celular.

## 2.6 Tema

Preserve o tema escuro original e o suporte ao tema claro.

Utilize os tokens de tema do HTML, incluindo a adaptação ao esquema de cores do sistema e a possibilidade de definir explicitamente o tema.

Não invente uma terceira identidade visual.

---

# 3. VALIDAÇÃO VISUAL OBRIGATÓRIA

Não basta dizer que a interface está parecida.

Você precisa testar visualmente.

Crie screenshots da aplicação implementada e compare com o HTML de referência.

Faça as comparações, no mínimo, nestas resoluções:

- Desktop: 1440 × 900.
- Notebook: 1280 × 800.
- Tablet: 860 × 1100.
- Celular: 390 × 844.

Compare as telas:
1. Login.
2. Hoje.
3. Faturamento e caixa.
4. Pipeline.
5. Lead 360.
6. Cadência de FUP.
7. Scorecard de calls.
8. Banco de objeções.
9. Perdas e recuperação.
10. Metas e ritmo.
11. Operações e comissão.
12. Modais de lead e venda.

Corrija diferenças de:
- Posição.
- Tamanho.
- Espaçamento.
- Tipografia.
- Cor.
- Bordas.
- Altura.
- Largura.
- Alinhamento.
- Quebra de linhas.
- Rolagem.
- Comportamento responsivo.

Repita o processo até atingir uma reprodução visual de alta fidelidade.

Não considere a tarefa concluída apenas porque os componentes existem.

---

# 4. ARQUITETURA DO PROJETO

Estruture o repositório desta maneira:

```text
closer-os-pro/
├── backend/
│   ├── app/
│   │   ├── Domain/
│   │   │   ├── Finance/
│   │   │   ├── Pipeline/
│   │   │   ├── Commission/
│   │   │   └── Goals/
│   │   ├── Enums/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Requests/
│   │   │   └── Resources/
│   │   ├── Models/
│   │   ├── Policies/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   └── seeders/
│   ├── routes/
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── today/
│   │   │   ├── finance/
│   │   │   ├── pipeline/
│   │   │   ├── leads/
│   │   │   ├── follow-ups/
│   │   │   ├── scorecard/
│   │   │   ├── objections/
│   │   │   ├── losses/
│   │   │   ├── goals/
│   │   │   ├── operations/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── styles/
│   │   └── types/
│   ├── public/
│   └── package.json
│
├── docs/
│   ├── REFERENCE_AUDIT.md
│   ├── DECISIONS.md
│   └── API.md
│
├── docker-compose.yml
├── README.md
└── .env.example
```

## 4.1 Frontend

- React 18 ou versão estável compatível.
- Vite.
- TypeScript.
- React Router.
- TanStack Query.
- Zustand apenas para estado local de interface.
- React Hook Form.
- Zod.
- date-fns.
- @dnd-kit para o Kanban.
- Vitest.
- Testing Library.
- Playwright.

A implementação visual deve utilizar CSS próprio e tokens extraídos do HTML. Não permita que o framework de estilização altere a aparência original.

## 4.2 Backend

- Laravel 12.
- PHP 8.3.
- MySQL 8.
- Laravel Sanctum.
- API REST JSON versionada em `/api/v1`.
- Form Requests.
- API Resources.
- Policies e autorização por perfil.
- Pest para testes.
- Laravel Pint.
- Larastan.

## 4.3 Regras técnicas

- Laravel é a fonte oficial dos dados.
- O frontend não é responsável por calcular valores financeiros oficiais.
- Todas as operações financeiras são processadas no backend.
- Dinheiro deve ser armazenado em centavos como inteiro.
- Nunca utilizar float para cálculos financeiros.
- Datas devem ser armazenadas em UTC e apresentadas no fuso `America/Sao_Paulo`.
- Todos os dados devem persistir no MySQL.
- Não usar localStorage como banco de dados.
- Não usar Firebase.
- Não deixar funcionalidades simuladas.
- Não criar botões sem ação real.

---

# 5. USUÁRIO ADMINISTRADOR INICIAL — OBRIGATÓRIO

Crie um usuário administrador inicial por meio de Seeder do Laravel.

Dados exatos:

```text
Nome: Thalis Gomes
E-mail: 1thalisgabriel1@gmail.com
Senha inicial: 123456
Perfil: admin
```

Requisitos:

1. O usuário deve ser criado no banco de dados pelo seeder.
2. O seeder deve ser idempotente: executá-lo novamente não pode criar usuários duplicados.
3. A senha deve ser armazenada usando o hash seguro do Laravel.
4. Nunca armazenar senha em texto puro.
5. Não colocar credenciais fixas no código do frontend.
6. O login deve autenticar de verdade pela API Laravel/Sanctum.
7. O administrador deve conseguir acessar todas as áreas administrativas.
8. O nome exibido no perfil deve ser Thalis Gomes.
9. A conta inicial deve exigir a troca da senha no primeiro acesso, sem impedir o login inicial com a senha informada.

A tela de login deve reproduzir fielmente o HTML, incluindo:
- Divisão visual em duas áreas.
- Logo.
- Texto principal.
- Quadro ilustrativo.
- Lista de benefícios.
- Campos de e-mail e senha.
- Botão de mostrar/ocultar senha.
- Lembrar de mim.
- Esqueci minha senha.
- Botão Entrar.
- Responsividade original.

Não utilize o login simulado do protótipo. A autenticação deve ser real.

---

# 6. USUÁRIOS, PERMISSÕES E ESTRUTURA COMERCIAL

O sistema deve suportar dois perfis:

## Administrador

Pode:
- Visualizar todos os leads.
- Visualizar todos os closers.
- Visualizar o financeiro consolidado.
- Gerenciar usuários.
- Criar e editar empresas.
- Criar e editar gerências/unidades.
- Configurar metas.
- Configurar remuneração.
- Configurar comissões.
- Gerenciar objeções.
- Gerenciar operações.
- Consultar todos os indicadores.
- Consultar históricos e relatórios.

## Closer

Pode:
- Visualizar os próprios leads.
- Gerenciar seus próprios leads.
- Registrar calls.
- Preencher Scorecard.
- Criar tarefas de FUP.
- Registrar vendas.
- Consultar o próprio faturamento.
- Consultar o próprio caixa.
- Consultar a própria comissão.
- Acompanhar suas metas.

Um closer nunca deve acessar os dados privados de outro closer.

## Estrutura inicial

Criar a estrutura inicial:

- Empresa: TZN Legacy.
- Gerência/unidade: Mercado Livre.
- Gerência/unidade: Visagismo.

A estrutura deve permitir que o administrador crie outras empresas e gerências futuramente.

A palavra "operação" também pode ser usada para identificar a frente comercial e seu percentual de comissão, mas empresa, gerência e operação devem ter entidades distintas quando necessário para não misturar conceitos.

---

# 7. MÓDULOS DO SISTEMA

Reproduza os módulos do HTML, preservando nomes, organização, navegação, hierarquia e aparência.

A navegação principal deve conter:

1. Hoje.
2. Faturamento e caixa.
3. Pipeline.
4. Lead 360.
5. Cadência de FUP.
6. Scorecard de calls.
7. Banco de objeções.
8. Perdas e recuperação.
9. Metas e ritmo.
10. Operações e comissão.
11. Prompt do agente.

As funcionalidades administrativas adicionais devem ser acessadas de maneira coerente com o design existente, sem descaracterizar a navegação.

## 7.1 Hoje

Reproduzir a tela original com:

- Saudação.
- Agenda de calls do dia.
- Horário de cada call.
- Nome do lead.
- Etapa atual.
- Contador de no-shows.
- Botão para abrir lead.
- Botão para marcar no-show.
- Botão para registrar fechamento.
- Alerta de leads que precisam de nova data.
- Resumo de faturamento do mês.
- Resumo de caixa do mês.
- Quantidade de calls hoje.
- Quantidade de leads que precisam de nova data.
- Botão Novo lead.

Os indicadores precisam vir da API.

## 7.2 Faturamento e caixa

Reproduzir:

- Filtro por nome do cliente.
- Data inicial.
- Data final.
- Filtro por operação.
- Atalhos de período.
- Faturamento contratado.
- Caixa líquido.
- A receber.
- Ticket médio.
- Comissão gerada.
- Gráfico de contratado x caixa dos últimos seis meses.
- Contratado por operação.
- Tabela de vendas.
- Ação para abrir e editar venda.

Os valores devem ser retornados pelo backend.

## 7.3 Pipeline

Preservar o Kanban horizontal, com as colunas originais:

1. Lead Agendado.
2. No-show.
3. FUP.
4. Remarcado.
5. Negociação.
6. Fechado.
7. Loss.
8. Desqualificado.
9. Reembolso.

A etapa Reembolso deve ser adicionada sem alterar a identidade visual das demais colunas.

Cada card deve mostrar:
- Nome do lead.
- Data e hora da call.
- Dias na etapa.
- Contador de no-show.
- Valor da venda, quando aplicável.
- Motivo de perda, quando aplicável.

Manter:
- Arrastar e soltar.
- Destaque da coluna de destino.
- Rolagem horizontal.
- Rolagem interna das colunas.
- Busca.
- Filtros por data.
- Indicadores de pipeline.
- Alternativa de movimentação por select no celular.

A movimentação deve atualizar o backend e o histórico.

## 7.4 Lead 360

Reproduzir a estrutura original:

- Lista de leads.
- Busca.
- Score circular.
- Temperatura.
- Dados de contato.
- Etapa.
- Dias na etapa.
- Contador de no-show.
- Qualificação BANT.
- Descrição pessoal.
- Próxima call.
- Resumo da venda.
- Descrição da venda.
- Faturamento.
- Caixa.
- Comissão.
- Linha do tempo.
- Campo para anotação rápida.

### Pontuação BANT

Manter os quatro critérios:

- Budget: tem verba.
- Authority: decide sozinho.
- Need: dor clara e urgente.
- Timing: prazo definido.

Cada critério vale 20 pontos.

Engajamento pode adicionar até 20 pontos, respeitando a lógica do HTML: 4 pontos por interação registrada, com limite de 20.

Pontuação máxima: 100 pontos.

Temperatura:
- 70 ou mais: Quente.
- 40 a 69: Morno.
- Abaixo de 40: Frio.

Os registros devem persistir.

## 7.5 Cadência de FUP

Preservar a biblioteca de mensagens do HTML, incluindo os grupos:

- Pós-call.
- Proposta enviada.
- No-show.
- Lead frio.

Preservar os textos, intervalos D0, D1, D2, D3, D4, D7, D8 e D10, conforme o HTML original.

Manter:
- Seleção de situação.
- Campo de nome do lead.
- Substituição de `{nome}`.
- Botão Copiar.
- Organização visual em etapas.

Além da biblioteca, implementar tarefas reais de follow-up:

- Criar tarefa.
- Associar ao lead.
- Associar ao closer.
- Definir data e hora.
- Registrar mensagem ou ação planejada.
- Definir prioridade.
- Marcar como concluída.
- Registrar histórico.
- Exibir tarefas atrasadas.
- Exibir tarefas do dia.
- Exibir próximas tarefas.

O histórico deve registrar criação, alteração e conclusão.

## 7.6 Scorecard de calls

Preservar a aparência original, incluindo:

- Checklist.
- Pontuação por critério.
- Controle deslizante da proporção de fala.
- Anel de pontuação.
- Foco da próxima call.
- Histórico visual das últimas oito calls.

Os critérios originais são:

| Critério | Pontos |
|---|---:|
| Abri com contrato de tempo e objetivo da call | 10 |
| Mapeei a situação atual do lead | 15 |
| O lead disse a dor com as próprias palavras | 15 |
| Quantifiquei o custo de não resolver | 15 |
| Defini critério e prazo de decisão | 10 |
| Apresentei a solução ligada à dor | 15 |
| Pedi o fechamento de forma direta | 10 |
| Combinei próximo passo com data e hora | 10 |

Pontuação máxima: 100 pontos.

Proporção de fala:
- Entre 30% e 50%: sem desconto.
- Entre 20% e 29%, ou entre 51% e 60%: desconto de 5 pontos.
- Abaixo de 20% ou acima de 60%: desconto de 10 pontos.

O resultado final nunca pode ser inferior a zero.

**Diferentemente do protótipo, as calls devem ser salvas no banco.**

Cada avaliação deve estar associada a:
- Closer.
- Lead.
- Data da call.
- Checklist.
- Proporção de fala.
- Pontuação.
- Observações.
- Resultado.

Criar histórico por closer e por call.

Exibir médias, evolução e últimas oito avaliações reais. Não usar dados simulados.

## 7.7 Banco de objeções

Preservar as seis objeções iniciais do HTML, incluindo os textos e respostas:

- Vou pensar.
- Está caro.
- Preciso falar com meu sócio.
- Já tentei e não deu certo.
- Agora não tenho tempo.
- Vou ver com calma e te falo.

Manter categorias, respostas, percentuais de referência e botão copiar.

O administrador deve conseguir:
- Criar objeção.
- Editar.
- Excluir.
- Alterar categoria.
- Alterar resposta.
- Consultar ocorrências.

Os percentuais do HTML são apenas referências iniciais, não taxas reais.

Criar registro de ocorrência de objeção por call, incluindo:
- Closer.
- Lead.
- Objeção.
- Data.
- Resultado: contornada ou não contornada.
- Observação.

Calcular a taxa real de contorno com base nos registros.

## 7.8 Perdas e recuperação

Preservar:
- Distribuição de motivos.
- Quantidade de leads por motivo.
- Seleção do motivo.
- Lista de leads.
- Dias na etapa.
- Nota do lead.
- Orientação de reativação.

Motivos iniciais:
- Preço.
- Sem tempo / timing.
- Decide com terceiro.
- Concorrente.
- Sem fit.
- Sem resposta.

Loss e Desqualificado devem ser tratados como situações diferentes.

O usuário poderá reativar um lead perdido ou desqualificado, mas a reativação deverá iniciar um novo ciclo, sem carregar o histórico anterior para o novo ciclo.

## 7.9 Metas e ritmo

Preservar a estrutura visual do HTML:

- Indicadores.
- Funil do mês.
- Calls agendadas.
- Compareceram.
- Leads que faltaram.
- Fechamentos.
- Calls por dia.
- Heatmap das últimas cinco semanas.

Adicionar metas configuráveis por:
- Empresa.
- Gerência/unidade.
- Closer.
- Mês.
- Indicador.

O administrador poderá definir e editar metas sem alterar código.

Os dados devem ser reais e filtráveis por período.

## 7.10 Operações e comissão

Preservar o layout de gestão de operações do HTML.

Permitir:
- Criar operação.
- Renomear.
- Alterar percentual.
- Arquivar.
- Reativar.
- Visualizar vendas vinculadas.

Percentuais iniciais:
- Mercado Livre: 7%.
- Visagismo masculino: 10%.

O percentual utilizado deve ser salvo como snapshot na venda. Alterações futuras não modificam vendas antigas.

A comissão deve ser calculada com base no caixa efetivamente recebido e no percentual congelado da venda.

---

# 8. REGRAS DE LEADS E CICLOS

O cadastro básico de lead deve conter apenas:

- Nome.
- Telefone.
- E-mail.
- Descrição pessoal.
- Data e hora da call.

Não adicionar campos desnecessários ao formulário inicial.

A qualificação, o histórico, as anotações e os dados de venda ficam no Lead 360.

Telefone repetido gera aviso, não bloqueio.

A descrição pessoal do lead e a descrição da venda são campos separados.

## No-show

Cada ocorrência de no-show deve ser registrada.

O contador representa o número de ocorrências durante o ciclo atual do lead.

Se o lead for excluído e cadastrado novamente ou reativado em um novo ciclo, o contador começa em zero.

## Exclusão e reativação

- Excluir um lead significa excluir seus dados e histórico conforme as permissões administrativas.
- Recadastrar o lead significa criar um novo registro.
- Reativar Loss ou Desqualificado cria um novo ciclo, sem transferir o histórico anterior.
- Não misturar ciclos diferentes nas métricas do ciclo atual.

## Conversão

A conversão comercial deve considerar somente calls efetivamente realizadas.

Fórmula:

`Conversão = vendas ÷ calls realizadas × 100`

Não contar no-shows como calls realizadas.

Desqualificados não devem afetar a conversão.

Registrar cada call como evento próprio, evitando contar um lead duas vezes ou confundir quantidade de leads com quantidade de calls.

---

# 9. REGRAS FINANCEIRAS — INVIOLÁVEIS

Esta parte deve ser implementada no backend, com serviços independentes e testes unitários.

Existem somente três formas de pagamento:

- Pix.
- Cartão.
- Boleto.

**Não existe modalidade Contrato. Não criar essa opção em nenhum lugar do sistema.**

Uma venda pode ter múltiplos pagamentos.

## 9.1 Pix

- Conta como faturamento.
- Pode estar Pendente ou Pago.
- Pendente conta no faturamento.
- Pendente não entra no caixa.
- Quando pago, entra no caixa pela data efetiva de recebimento.
- Deve ter data prevista de pagamento.
- Deve ter data efetiva de recebimento quando pago.

## 9.2 Cartão

- Conta como faturamento.
- Pode estar Pendente ou Pago.
- Pendente conta no faturamento.
- Pendente não entra no caixa.
- Quando pago, entra no caixa pela data efetiva de recebimento.
- Deve ter data prevista.
- Deve ter data efetiva quando pago.

**Não descontar taxa de gateway.**

O usuário já informará o valor líquido recebido no cartão. O valor informado é a base oficial do caixa.

Não inventar taxas ou aplicar percentuais de gateway.

## 9.3 Boleto

- Conta como faturamento.
- É considerado pago para fins de faturamento.
- Não gera caixa.
- Não pode ficar pendente.
- Não deve ser contabilizado como dinheiro recebido.

## 9.4 Fórmulas

Faturamento:

`Soma de todos os pagamentos da venda.`

Caixa:

`Soma dos pagamentos Pix e Cartão efetivamente pagos.`

A receber:

`Soma dos pagamentos Pix e Cartão pendentes.`

Comissão:

`Caixa recebido × percentual de comissão congelado na venda.`

O boleto nunca entra no caixa.

Pagamento pendente nunca entra no caixa.

O caixa deve ser reconhecido no mês da data efetiva de recebimento, não no mês da venda ou da previsão.

Faturamento deve ser reconhecido no mês do fechamento da venda.

## 9.5 Datas

Todo pagamento Pix ou Cartão deve permitir:

- Data prevista de pagamento.
- Status.
- Data efetiva de recebimento, quando pago.

Quando um pagamento pendente for marcado como pago, o sistema deve:
1. Registrar a data efetiva.
2. Atualizar o caixa.
3. Atualizar a comissão.
4. Atualizar os indicadores.
5. Atualizar os relatórios do mês correspondente.

---

# 10. REEMBOLSO

A etapa Reembolso deve existir no pipeline.

A exclusão de uma venda significa necessariamente reembolso integral.

Não implementar exclusão simples de venda como se fosse cancelamento sem impacto financeiro.

Ao registrar um reembolso:

1. Registrar o reembolso integral da venda.
2. Estornar o faturamento original.
3. Estornar o caixa efetivamente recebido.
4. Estornar a comissão relacionada.
5. Cancelar valores pendentes ainda não recebidos.
6. Registrar data do reembolso.
7. Registrar valor.
8. Registrar motivo.
9. Registrar responsável.
10. Preservar o registro original e a trilha de auditoria.
11. Mover o lead para a etapa Reembolso.

O estorno do caixa deve considerar somente valores efetivamente recebidos. Valores pendentes não devem gerar estorno de caixa porque nunca entraram no caixa.

O sistema deve impedir que o mesmo reembolso seja processado duas vezes.

O reembolso deve atualizar todos os indicadores, relatórios, metas e comissões.

Não apagar fisicamente a venda original para esconder o histórico financeiro.

---

# 11. REMUNERAÇÃO E META DA TZN LEGACY

Criar uma estrutura de remuneração configurável no backend.

Regra inicial da TZN Legacy:

- Meta mensal de caixa: R$ 18.000.
- Fixo integral: R$ 1.800.
- Ao atingir 70% da meta: recebe R$ 900 de fixo mais comissões.
- Ao atingir 100% da meta: recebe R$ 1.800 de fixo mais comissões.
- Abaixo de 70%: recebe apenas comissões.

Faixas:

| Atingimento da meta | Fixo |
|---|---:|
| Abaixo de 70% | R$ 0 |
| De 70% até abaixo de 100% | R$ 900 |
| 100% ou mais | R$ 1.800 |

A comissão é adicional ao fixo, não está incluída nele.

**A meta é calculada pelo caixa efetivamente recebido durante o mês.**

Não considerar:
- Pagamentos pendentes.
- Valores previstos.
- Boleto.
- Valores que não entraram no caixa.
- Vendas reembolsadas.

Se um pagamento pendente for recebido em outro mês, ele entra na meta do mês do recebimento.

O sistema deve guardar snapshots mensais da meta, atingimento, fixo e comissão, para que mudanças futuras nas regras não alterem meses fechados.

O administrador deve conseguir configurar:
- Valor da meta.
- Valor do fixo.
- Percentual de cada faixa.
- Valor de fixo de cada faixa.
- Comissão.
- Vigência das regras.

Não deixar esses valores fixos no código.

---

# 12. MODELAGEM DE DADOS

Crie migrations e relacionamentos adequados para, no mínimo:

- users
- companies
- departments
- operations
- leads
- lead_cycles
- lead_events
- calls
- call_scorecards
- call_objections
- objections
- follow_up_templates
- follow_up_tasks
- sales
- payments
- refunds
- goals
- goal_snapshots
- compensation_rules
- compensation_snapshots
- notes
- audit_logs

Use chaves estrangeiras, índices e políticas de exclusão adequadas.

Registre o responsável por cada operação.

A modelagem deve suportar múltiplos closers, empresas e gerências sem misturar dados.

Não concentre tudo em uma única tabela JSON.

---

# 13. API

Crie API REST versionada em `/api/v1`.

Inclua endpoints para:

- Autenticação.
- Usuário logado.
- Usuários e permissões.
- Empresas.
- Gerências.
- Operações.
- Leads.
- Ciclos de lead.
- Transições do pipeline.
- Qualificação BANT.
- Calls.
- Scorecards.
- Objeções.
- Ocorrências de objeção.
- Biblioteca de FUP.
- Tarefas de FUP.
- Vendas.
- Pagamentos.
- Reembolsos.
- Indicadores financeiros.
- Indicadores comerciais.
- Metas.
- Remuneração.
- Snapshots.
- Auditoria.

As respostas financeiras devem retornar valores calculados pelo backend.

O frontend não pode ser a fonte oficial dos cálculos.

Utilize Policies para garantir que closers só acessem seus próprios dados e que administradores tenham visão consolidada.

---

# 14. TESTES OBRIGATÓRIOS

Crie testes automatizados para:

## Financeiro
- Pix pago.
- Pix pendente.
- Cartão pago.
- Cartão pendente.
- Boleto.
- Venda com pagamentos mistos.
- Recebimento em mês diferente da venda.
- Comissão por operação.
- Snapshot do percentual.
- Reembolso integral.
- Estorno de caixa.
- Estorno de comissão.
- Cancelamento de pendências.
- Proteção contra reembolso duplicado.

## Pipeline
- Todas as transições.
- Fechamento exige venda.
- Loss exige motivo.
- Desqualificado exige motivo.
- No-show incrementa contador.
- Reativação cria novo ciclo.
- Reembolso move lead para etapa correta.

## Metas e remuneração
- Abaixo de 70%.
- Exatamente 70%.
- Entre 70% e 100%.
- Exatamente 100%.
- Acima de 100%.
- Caixa recebido em outro mês.
- Pendentes não contam.
- Reembolso reduz o atingimento.

## Permissões
- Admin visualiza todos.
- Closer visualiza somente seus leads e resultados.
- Closer não acessa dados de outro closer.

## Frontend
- Login.
- Criação de lead.
- Edição de lead.
- Movimentação no Kanban.
- Registro de venda.
- Pagamento pendente para pago.
- Registro de reembolso.
- Criação de FUP.
- Registro de Scorecard.
- Filtros.
- Responsividade.

---

# 15. IMPLEMENTAÇÃO POR FASES

Trabalhe nesta ordem:

### Fase 1 — Auditoria e arquitetura
- Ler o HTML integralmente.
- Criar `REFERENCE_AUDIT.md`.
- Criar estrutura do projeto.
- Criar `DECISIONS.md`.
- Definir entidades e relacionamentos.

### Fase 2 — Backend e autenticação
- Laravel.
- MySQL.
- Sanctum.
- Seeder do administrador.
- Perfis e permissões.
- Testes de autenticação.

### Fase 3 — Design system e shell visual
- Tokens CSS.
- Fontes.
- Login.
- Sidebar.
- Navegação.
- Layout.
- Cards.
- Botões.
- Inputs.
- Modais.
- Toasts.
- Responsividade.

Nesta fase, faça a primeira comparação visual com o HTML.

### Fase 4 — Leads e pipeline
- CRUD de leads.
- Lead 360.
- BANT.
- Timeline.
- Kanban.
- No-show.
- Loss.
- Desqualificado.
- Ciclos.

### Fase 5 — Vendas e financeiro
- Operações.
- Vendas.
- Pagamentos.
- Faturamento.
- Caixa.
- Comissão.
- Reembolso.

### Fase 6 — Inteligência comercial
- Scorecard.
- Histórico de calls.
- Objeções.
- Taxas reais de contorno.
- Biblioteca de FUP.
- Tarefas de FUP.
- Perdas e recuperação.

### Fase 7 — Metas e remuneração
- Empresas.
- Gerências.
- Metas.
- Regras de remuneração.
- Snapshots mensais.
- Relatórios.

### Fase 8 — Acabamento
- Comparação visual de todas as telas.
- Correção de diferenças.
- Testes.
- Permissões.
- Estados vazios.
- Loading.
- Erros.
- Responsividade.
- Documentação.
- Instruções de execução.

---

# 16. CRITÉRIOS DE ACEITAÇÃO FINAL

O projeto só estará concluído quando:

1. O administrador inicial conseguir entrar com o e-mail e a senha definidos neste prompt.
2. O login estiver conectado ao Laravel.
3. Os dados forem salvos no MySQL.
4. O sistema suportar admin e closers.
5. Todos os módulos estiverem implementados.
6. Todos os botões tiverem ações funcionais.
7. O Kanban funcionar.
8. O Lead 360 estiver persistido.
9. As calls e Scorecards estiverem salvos.
10. O banco de objeções calcular taxas reais.
11. As tarefas de FUP estiverem funcionando.
12. O financeiro separar corretamente faturamento e caixa.
13. Os pagamentos pendentes não entrarem no caixa.
14. O boleto não gerar caixa.
15. Não existir modalidade Contrato.
16. Não existir taxa de cartão.
17. Os reembolsos estornarem os valores corretamente.
18. As metas e remunerações seguirem as faixas configuradas.
19. As permissões estiverem corretas.
20. A interface tiver sido comparada visualmente com o HTML em desktop e celular.
21. Os testes automatizados estiverem passando.
22. O README explicar como instalar, configurar, executar e testar.

## REGRA FINAL

Não entregue somente um protótipo.

Não entregue somente o frontend.

Não entregue somente telas estáticas.

Não entregue funcionalidades simuladas.

Não deixe botões sem ação.

Não use dados fictícios como se fossem dados reais.

Não altere o design por preferência pessoal.

Não considere concluído enquanto houver módulos faltando ou diferenças visuais importantes.

**O resultado esperado é o Closer OS Pro funcionando de verdade, com backend Laravel, frontend React + Vite, MySQL, autenticação, regras comerciais e financeiras completas e uma interface reproduzida fielmente a partir do HTML fornecido.**

Primeiro audite. Depois implemente. Depois teste. Depois compare visualmente. Corrija até ficar fiel ao original.