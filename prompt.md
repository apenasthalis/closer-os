# PROMPT MASTER — CONSTRUÇÃO DO CLOSER OS PRO

## 1. Seu papel

Você é um engenheiro de software sênior, arquiteto full-stack e especialista em sistemas de CRM, gestão comercial e controle financeiro.

Sua missão é construir uma aplicação completa chamada **Closer OS Pro**, reproduzindo fielmente o sistema apresentado no arquivo HTML de referência anexado.

O projeto deverá ser desenvolvido do zero utilizando:

- **Frontend:** React + Vite + TypeScript.
- **Backend:** Laravel + PHP.
- **Banco de dados:** MySQL.
- **Arquitetura:** API REST, com frontend e backend em pastas separadas.

Não quero apenas uma demonstração visual, protótipo ou conjunto de telas estáticas. Quero uma aplicação funcional, com autenticação, persistência real, regras de negócio, cálculos financeiros, histórico, permissões e testes.

---

# 2. REGRA MAIS IMPORTANTE: O HTML É A REFERÊNCIA OBRIGATÓRIA

O arquivo `Closer OS Pro.html` está anexado a esta tarefa.

**Antes de escrever qualquer código, leia e analise integralmente esse arquivo.**

Ele representa a referência visual e funcional do produto que quero construir.

Não crie uma interface genérica de CRM. Não substitua o design por um template administrativo pronto. Não simplifique os módulos sem autorização.

Você deverá preservar, tanto quanto possível:

- A identidade visual.
- A estrutura de navegação.
- A organização dos módulos.
- A disposição dos cards.
- Os títulos, textos e nomenclaturas.
- As cores, tipografia, bordas e espaçamentos.
- Os componentes e suas interações.
- Os modais e formulários.
- Os gráficos, indicadores e tabelas.
- Os filtros e seletores.
- A experiência de navegação.
- A responsividade para desktop e dispositivos móveis.

### Identidade visual

A referência utiliza uma identidade escura, com:

- Fundo predominantemente preto/esverdeado.
- Superfícies em tons escuros.
- Verde como cor principal de destaque.
- Indicadores de alerta em amarelo, vermelho e azul.
- Tipografia Inter e Space Grotesk.
- Cards com bordas discretas e cantos arredondados.
- Interface organizada, compacta e orientada à produtividade.

Preserve essa identidade.

O HTML original serve como especificação visual e funcional. Entretanto, não copie sua implementação técnica de JavaScript ou sua estrutura de armazenamento. Reconstrua o comportamento utilizando React, Laravel e banco de dados.

### Hierarquia de regras

Quando houver divergência:

1. As regras de negócio descritas neste prompt prevalecem.
2. Os comportamentos e a interface do HTML devem ser preservados quando não houver conflito.
3. Nenhuma regra financeira ou comercial poderá ser inventada para preencher lacunas.

Antes de implementar, faça uma auditoria do HTML e produza `docs/REFERENCE_AUDIT.md`, contendo:
- Todos os módulos identificados.
- Todas as telas e componentes.
- Todos os formulários e campos.
- Todos os comportamentos e interações.
- Todas as regras de negócio encontradas.
- Todas as diferenças entre o HTML e este prompt.
- Como cada funcionalidade será reproduzida no novo sistema.

Não comece a implementação sem concluir essa auditoria.

---

# 3. ARQUITETURA E ORGANIZAÇÃO DO PROJETO

Utilize um único repositório com esta estrutura:

```text
closer-os-pro/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── modules/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── schemas/
│   │   ├── types/
│   │   ├── utils/
│   │   └── routes/
│   ├── public/
│   ├── tests/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── Models/
│   │   ├── Http/
│   │   ├── Services/
│   │   ├── Enums/
│   │   ├── Policies/
│   │   └── Domain/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   └── tests/
│
├── docs/
│   ├── REFERENCE_AUDIT.md
│   ├── BUSINESS_RULES.md
│   ├── DATA_MODEL.md
│   ├── API.md
│   └── DECISIONS.md
│
└── README.md
```

### Frontend

- React.
- Vite.
- TypeScript.
- React Router.
- TanStack Query para dados da API.
- Zustand apenas para estados locais de interface.
- Tailwind CSS e componentes próprios.
- Radix UI quando necessário.
- React Hook Form.
- Zod.
- date-fns.
- @dnd-kit para o Kanban.
- Vitest e Testing Library.
- Playwright para testes de fluxos completos.

### Backend

- Laravel 12.
- PHP 8.3 ou superior compatível.
- MySQL 8.
- Laravel Sanctum para autenticação SPA.
- API REST versionada em `/api/v1`.
- Form Requests para validação.
- API Resources para respostas.
- Policies para autorização.
- Enums para estados controlados.
- Services e classes de domínio para regras comerciais e financeiras.

### Regras técnicas obrigatórias

1. Toda regra de negócio deverá ser executada e validada no Laravel.
2. O React não poderá ser a fonte da verdade de nenhum cálculo financeiro.
3. O frontend deverá consumir a API.
4. Não armazenar informações financeiras apenas em localStorage.
5. Não utilizar dados simulados como se fossem dados reais.
6. Utilizar transações de banco em operações financeiras.
7. Utilizar valores monetários em centavos, com inteiros (`BIGINT`), nunca `float`.
8. Armazenar datas de maneira consistente e apresentar no fuso `America/Sao_Paulo`.
9. Implementar validação no backend mesmo quando já existir validação no frontend.
10. Garantir integridade referencial e consistência dos registros.

---

# 4. USUÁRIOS, AUTENTICAÇÃO E PERMISSÕES

O sistema terá dois perfis principais:

### Administrador

- Visualiza todos os closers.
- Visualiza todos os leads.
- Visualiza todas as vendas.
- Visualiza faturamento e caixa consolidados.
- Visualiza comissões.
- Gerencia empresas e gerências.
- Gerencia usuários.
- Configura metas.
- Visualiza relatórios gerais.
- Pode editar e administrar os registros conforme permissões.

### Closer

- Visualiza seus próprios leads.
- Visualiza suas próprias calls.
- Visualiza suas vendas.
- Visualiza seu faturamento e caixa.
- Visualiza suas comissões.
- Visualiza suas metas.
- Gerencia seus follow-ups.
- Registra suas avaliações de calls.
- Não acessa os dados privados de outros closers.

Cada lead deverá estar associado a um responsável.

O administrador poderá atribuir leads a closers e visualizar os resultados consolidados.

Todas as consultas e alterações deverão respeitar as permissões no backend. Não basta esconder botões na interface.

---

# 5. MÓDULOS DO SISTEMA

Reproduza os módulos existentes no HTML, preservando a organização visual e os nomes:

1. Hoje.
2. Faturamento.
3. Pipeline.
4. Lead 360.
5. Cadência.
6. Calls.
7. Objeções.
8. Perdas.
9. Ritmo.
10. Operações.

Além desses módulos, implemente autenticação, administração de usuários, empresas, gerências e metas, integrando-os à estrutura existente sem descaracterizar o design.

## 5.1. Hoje

Dashboard com visão do dia.

Deverá apresentar:

- Calls agendadas.
- Calls realizadas.
- Próximos compromissos.
- Leads que precisam de acompanhamento.
- Follow-ups atrasados.
- Indicadores de vendas.
- Resumo de faturamento e caixa.
- Indicadores de metas.
- Informações relevantes da operação.

Os indicadores deverão respeitar o usuário logado e o período selecionado.

## 5.2. Faturamento

Painel financeiro com separação rigorosa entre:

- Faturamento.
- Caixa recebido.
- Valores pendentes.
- Comissões.
- Reembolsos.

Deverá permitir filtros por:

- Período.
- Mês.
- Empresa.
- Gerência.
- Closer.
- Forma de pagamento.

Exibir indicadores, gráficos e histórico de vendas.

**Nunca confundir faturamento com caixa.**

## 5.3. Pipeline

Implementar um Kanban com as etapas:

1. Lead Agendado.
2. No-show.
3. FUP.
4. Remarcado.
5. Negociação.
6. Fechado.
7. Reembolso.
8. Loss.
9. Desqualificado.

O usuário poderá mover os leads livremente entre as etapas, inclusive arrastando cards.

No celular, oferecer alternativa por menu de movimentação.

Ao mover um lead para Loss ou Desqualificado, exigir motivo e permitir uma nota explicativa.

Ao mover para Reembolso, a origem deverá ser um processo financeiro de reembolso, não uma simples movimentação manual.

### Regras do histórico

O histórico do lead deverá acompanhar seu ciclo de vida.

Porém:

- Se o lead for excluído, seus dados e histórico serão removidos.
- Se for cadastrado novamente, será considerado um novo lead.
- Se for reativado a partir de Loss ou Desqualificado, será criado como novo ciclo, sem preservar o histórico anterior.
- O contador de no-show será reiniciado no novo ciclo.

O pipeline deverá apresentar contadores e indicadores por etapa.

## 5.4. Lead 360

Tela completa de detalhes do lead.

### Cadastro básico

Manter um cadastro enxuto:

- Nome.
- Telefone.
- E-mail.
- Descrição pessoal.
- Data e hora da call.
- Closer responsável.
- Empresa/gerência relacionada.

A qualificação e o histórico deverão ficar separados do formulário básico.

### Qualificação BANT

Preservar os quatro critérios do HTML:

- Budget.
- Authority.
- Need.
- Timing.

Cada critério vale 20 pontos.

O engajamento poderá adicionar até 20 pontos.

Pontuação total: 100 pontos.

Apresentar visualmente a pontuação, os critérios preenchidos e o nível de qualificação.

### Histórico

Registrar:

- Criação do lead.
- Alterações relevantes.
- Movimentações no pipeline.
- Calls agendadas.
- Calls realizadas.
- No-shows.
- Notas.
- Follow-ups.
- Vendas.
- Reembolsos.

O histórico deverá ser ordenado cronologicamente.

## 5.5. Cadência de FUP

Preservar os cenários e modelos de mensagens existentes no HTML.

O módulo deverá ter duas funcionalidades:

**A. Biblioteca de mensagens**

- Modelos de mensagens por situação.
- Texto pronto para copiar.
- Personalização com nome do lead.
- Possibilidade de editar e cadastrar novos modelos.
- Organização por tipo de abordagem.

**B. Gestão de follow-ups**

- Criar tarefa de acompanhamento.
- Associar ao lead.
- Definir data e horário.
- Registrar mensagem ou ação planejada.
- Marcar como concluído.
- Registrar o resultado.
- Consultar histórico.
- Identificar tarefas atrasadas.
- Mostrar próximos acompanhamentos.

Os follow-ups deverão aparecer no dashboard Hoje e no Lead 360.

## 5.6. Calls / Scorecard

Implementar um sistema histórico de avaliação de calls.

Cada avaliação deverá estar associada a:

- Lead.
- Closer.
- Data da call.
- Empresa/gerência, quando aplicável.

Não utilizar apenas avaliações simuladas ou temporárias.

Cada call deverá possuir seu próprio scorecard persistido.

Preservar os critérios e a lógica de avaliação do HTML.

### Regras

- Pontuação total de 100 pontos.
- Manter os critérios e pesos encontrados na referência.
- Incluir o ajuste relacionado à proporção de fala do closer e do lead, conforme a lógica do HTML.
- Permitir consultar avaliações anteriores.
- Exibir média por closer.
- Exibir evolução por período.
- Exibir desempenho por critério.
- Exibir histórico individual de calls.

O módulo deverá permitir analisar a evolução comercial, e não apenas preencher uma avaliação.

## 5.7. Banco de objeções

Preservar as seis objeções existentes no HTML e suas referências iniciais de conversão.

Entretanto, transforme o banco em um módulo gerenciável.

Permitir:

- Cadastrar objeções.
- Editar objeções.
- Cadastrar respostas e argumentos.
- Registrar quando uma objeção foi apresentada.
- Associar a objeção a uma call e a um lead.
- Registrar se a objeção foi contornada.
- Registrar se a venda aconteceu.
- Consultar ocorrências.

Os percentuais estáticos encontrados no HTML deverão ser tratados como referências iniciais, não como resultados reais.

O sistema deverá calcular indicadores reais com base nos registros históricos.

Exibir:

- Quantidade de ocorrências.
- Quantidade de objeções contornadas.
- Quantidade de vendas.
- Taxa de conversão.
- Desempenho por closer.

## 5.8. Perdas

Módulo para analisar leads perdidos e desqualificados.

Preservar os motivos e a organização visual encontrados no HTML.

Apresentar:

- Quantidade de perdas.
- Motivos.
- Observações.
- Empresa/gerência.
- Closer responsável.
- Período.
- Taxas e gráficos.

### Regra fundamental de conversão

**Desqualificados não devem prejudicar a taxa de conversão comercial.**

A conversão deverá considerar somente calls efetivamente realizadas.

Não utilizar a quantidade total de leads cadastrados como denominador da conversão.

Loss e Desqualificado devem ser indicadores separados.

Permitir reativar leads perdidos ou desqualificados, criando um novo ciclo sem histórico anterior.

## 5.9. Ritmo e metas

Implementar um painel de metas mensais.

O sistema deverá permitir cadastrar metas pessoais para cada closer, por empresa e gerência.

Metas configuráveis:

- Calls agendadas.
- Calls realizadas.
- Vendas.
- Faturamento.
- Caixa.
- Comissões.
- Outras metas quantitativas necessárias.

Exibir:

- Meta mensal.
- Resultado atual.
- Percentual atingido.
- Quanto falta.
- Projeção de resultado.
- Histórico dos meses anteriores.
- Comparação entre meta e realizado.

Permitir que o administrador configure metas e que o closer acompanhe suas próprias metas.

### Regra especial de remuneração — TZN Legacy

Existe uma regra de remuneração pessoal que deverá ser configurável e implementada desde o início.

Configuração inicial:

- Empresa: TZN Legacy.
- Meta mensal de caixa: R$ 18.000.
- Fixo integral: R$ 1.800.
- Marco intermediário: 70% da meta.

A regra é:

| Resultado de caixa no mês | Remuneração fixa |
|---|---:|
| Abaixo de 70% | R$ 0 |
| A partir de 70% e abaixo de 100% | R$ 900 |
| A partir de 100% | R$ 1.800 |

Além do fixo, as comissões devidas deverão ser calculadas normalmente.

Exemplos:

- R$ 10.000 de caixa: não atingiu 70%, recebe comissões, sem fixo.
- R$ 12.600 de caixa: atingiu 70%, recebe R$ 900 + comissões.
- R$ 18.000 de caixa: atingiu 100%, recebe R$ 1.800 + comissões.

O cálculo deverá considerar exclusivamente o caixa efetivamente recebido dentro do mês.

Um pagamento pendente não conta como caixa. Quando for pago, passa a contar no mês da data em que efetivamente entrou no caixa.

Não utilizar a data de fechamento da venda para determinar o mês de caixa.

### Painel da remuneração

Criar um espaço visual que mostre:

- Meta de R$ 18.000.
- Caixa realizado no mês.
- Percentual atingido.
- Quanto falta para 70%.
- Quanto falta para 100%.
- Status do fixo.
- Fixo previsto.
- Comissões acumuladas.
- Remuneração total prevista.

Os valores de meta e remuneração deverão ser editáveis por configuração administrativa, sem necessidade de alterar código.

O sistema deverá preservar a configuração histórica de cada mês para que alterações futuras não modifiquem meses anteriores.

## 5.10. Operações, empresas e gerências

Este módulo deverá ser adaptado para trabalhar com empresas e gerências, em vez de depender de nomes fixos de operações.

Criar uma estrutura flexível:

- Empresas.
- Gerências ou unidades de negócio.
- Closer vinculado à empresa/gerência.
- Metas por empresa/gerência.
- Regras de comissão por empresa/gerência.

Configuração inicial sugerida:

- Empresa: TZN Legacy.
- Gerência/linha de operação: Mercado Livre.
- Gerência/linha de operação: Visagismo.

Esses cadastros deverão ser editáveis pelo administrador.

O objetivo é permitir que o usuário tenha metas e regras de remuneração diferentes conforme a empresa ou gerência em que trabalha.

Não limitar o sistema a essas duas opções.

---

# 6. REGRAS FINANCEIRAS — PRIORIDADE MÁXIMA

As regras financeiras precisam ser implementadas com extremo cuidado.

Toda operação financeira deve ser calculada no backend, com testes automatizados.

## 6.1. Formas de pagamento

Existirão apenas três formas de pagamento:

1. Pix.
2. Cartão.
3. Boleto.

Não criar modalidade de contrato.

Cada venda poderá conter vários pagamentos, inclusive combinações de formas diferentes.

Exemplo:

Venda de R$ 5.000:

- R$ 2.000 no Pix.
- R$ 2.000 no cartão.
- R$ 1.000 no boleto.

Cada pagamento deverá ter seus próprios dados e status.

## 6.2. Status de pagamento

Pix e cartão poderão ser:

- Pendente.
- Pago.

O boleto deverá ser registrado como pago automaticamente, conforme a regra operacional definida para o sistema, sem gerar caixa.

Para Pix e cartão, permitir informar:

- Valor.
- Data prevista de pagamento.
- Status.
- Data efetiva do recebimento.

Quando estiver pendente:

- Conta no faturamento.
- Não entra no caixa.
- Não conta como caixa para metas.
- Não conta como caixa para remuneração fixa.

Quando for marcado como pago:

- Deve registrar a data efetiva de recebimento.
- Entra no caixa do mês dessa data.
- Passa a contar para metas de caixa.
- Passa a contar para o cálculo do fixo.
- Atualiza os indicadores financeiros.

A data prevista não pode ser confundida com a data efetiva de recebimento.

## 6.3. Faturamento

Faturamento representa o valor total das vendas registradas, independentemente de o pagamento já ter sido recebido.

Portanto:

- Pix pago: conta no faturamento.
- Pix pendente: conta no faturamento.
- Cartão pago: conta no faturamento.
- Cartão pendente: conta no faturamento.
- Boleto: conta no faturamento.

Não descontar taxa de cartão.

O valor informado pelo usuário já será o valor considerado para os cálculos.

## 6.4. Caixa

Caixa representa exclusivamente os valores efetivamente recebidos.

- Pix pago: entra no caixa.
- Cartão pago: entra no caixa.
- Pix pendente: não entra no caixa.
- Cartão pendente: não entra no caixa.
- Boleto: não entra no caixa.

Quando um Pix ou cartão pendente for marcado como pago, deverá entrar no caixa na data efetiva de recebimento.

O boleto permanece fora do caixa, mesmo sendo considerado pago para fins de faturamento.

## 6.5. Comissões

As comissões deverão ser configuráveis por empresa ou gerência.

A fórmula será:

`Comissão = Caixa recebido elegível × percentual de comissão`

Não utilizar faturamento pendente para calcular comissão.

O percentual de comissão deverá ser congelado na venda no momento do fechamento, como snapshot.

Assim, se o percentual for alterado no futuro, vendas anteriores não serão recalculadas com a nova porcentagem.

O sistema deverá apresentar:

- Comissão total gerada.
- Comissão por venda.
- Comissão por empresa.
- Comissão por gerência.
- Comissão por período.
- Comissão por closer.

As regras específicas da remuneração fixa da TZN Legacy deverão ser calculadas separadamente da comissão.

## 6.6. Reembolsos

A exclusão de uma venda deverá obrigatoriamente gerar um processo de reembolso.

Não apagar financeiramente a venda como se ela nunca tivesse existido.

O procedimento deverá:

1. Registrar um reembolso de 100% do valor original da venda.
2. Preservar o registro original da venda.
3. Registrar a data do reembolso.
4. Registrar o valor.
5. Registrar a empresa e gerência.
6. Registrar o closer responsável.
7. Registrar os pagamentos relacionados.
8. Registrar o usuário que realizou a operação.
9. Estornar o faturamento correspondente.
10. Estornar o caixa efetivamente recebido correspondente.
11. Reverter a comissão associada.
12. Cancelar os valores que ainda estavam pendentes.
13. Mover o lead para a etapa Reembolso.

O reembolso deverá ser visível nos relatórios financeiros.

A operação deverá ser atômica: se qualquer etapa falhar, nenhuma alteração parcial poderá permanecer.

Manter auditoria de quem realizou a exclusão e quando.

Não permitir excluir ou alterar um reembolso silenciosamente.

---

# 7. REGRAS DE CONVERSÃO E INDICADORES

A conversão comercial deverá ser calculada considerando apenas calls efetivamente realizadas.

A fórmula deverá ser:

`Taxa de conversão = Vendas ÷ Calls realizadas × 100`

Não considerar:

- Leads apenas cadastrados.
- Leads agendados que ainda não realizaram call.
- No-shows.
- Leads desqualificados sem call realizada.

Um lead poderá ter várias tentativas de agendamento e no-show, mas cada call efetivamente realizada deverá ser registrada corretamente.

Evitar duplicidade de contagem.

Distinguir:

- Calls agendadas.
- Calls realizadas.
- No-shows.
- Vendas.
- Reembolsos.
- Loss.
- Desqualificados.

Os relatórios deverão permitir filtros por mês, closer, empresa e gerência.

---

# 8. MODELAGEM DE DADOS

Antes de implementar, desenhe o modelo relacional e documente em `docs/DATA_MODEL.md`.

Considere, no mínimo, as seguintes entidades:

- users
- companies
- departments ou business_units
- user_company_assignments
- leads
- lead_qualifications
- lead_timeline_events
- calls
- call_scorecards
- call_objections
- objections
- sales
- sale_payments
- refunds
- follow_up_templates
- follow_up_tasks
- goals
- compensation_rules
- commissions
- monthly_compensation_snapshots
- pipeline_stage_events
- audit_logs

Adapte os nomes se necessário, mas preserve a separação conceitual.

### Integridade e histórico

- Relacionar cada lead a um closer.
- Relacionar vendas a leads.
- Relacionar pagamentos a vendas.
- Relacionar reembolsos às vendas originais.
- Relacionar scorecards às calls.
- Relacionar follow-ups aos leads.
- Relacionar metas às empresas, gerências e closers.
- Preservar snapshots financeiros.
- Registrar auditoria de operações importantes.

A exclusão de lead deverá seguir a regra de ciclo de vida definida neste prompt.

A exclusão de venda, por outro lado, deverá produzir reembolso auditável, sem apagar o registro financeiro original.

---

# 9. API E SEGURANÇA

Criar endpoints REST organizados e documentados.

Exemplos de recursos:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/companies`
- `/api/v1/departments`
- `/api/v1/leads`
- `/api/v1/leads/{id}/qualification`
- `/api/v1/leads/{id}/timeline`
- `/api/v1/pipeline`
- `/api/v1/calls`
- `/api/v1/scorecards`
- `/api/v1/objections`
- `/api/v1/follow-ups`
- `/api/v1/sales`
- `/api/v1/sales/{id}/payments`
- `/api/v1/sales/{id}/refund`
- `/api/v1/finance`
- `/api/v1/goals`
- `/api/v1/commissions`
- `/api/v1/reports`

Os endpoints deverão validar permissões e propriedade dos registros.

Não confiar em valores enviados pelo frontend para:

- Comissão.
- Faturamento.
- Caixa.
- Reembolso.
- Metas.
- Remuneração fixa.
- Conversão.

O backend deverá recalcular e validar todos esses dados.

---

# 10. TESTES OBRIGATÓRIOS

Não considerar o projeto pronto apenas porque as telas estão funcionando.

Criar testes unitários, de integração e de ponta a ponta.

### Cenários financeiros

1. Venda de R$ 5.000 com Pix pago: faturamento de R$ 5.000 e caixa de R$ 5.000.
2. Venda de R$ 5.000 com Pix pendente: faturamento de R$ 5.000 e caixa zero.
3. Venda com cartão pendente: faturamento contabilizado e caixa zero.
4. Pix pendente pago em mês posterior: caixa contabilizado somente no mês do recebimento.
5. Boleto: faturamento contabilizado, sem geração de caixa.
6. Venda com múltiplos pagamentos: somas corretas por pagamento.
7. Comissão calculada apenas sobre caixa elegível.
8. Alteração de percentual de comissão não modifica vendas anteriores.
9. Reembolso integral reverte os valores financeiros e a comissão corretamente.
10. Reembolso cancela pagamentos pendentes.
11. Reembolso não deixa valores parcialmente contabilizados.
12. Datas previstas não são confundidas com datas de recebimento.

### Cenários de remuneração

1. Caixa abaixo de 70% da meta: somente comissões.
2. Caixa igual a 70%: metade do fixo + comissões.
3. Caixa entre 70% e 99,99%: metade do fixo + comissões.
4. Caixa igual a 100%: fixo integral + comissões.
5. Pagamento recebido em mês posterior: conta apenas no mês de recebimento.
6. Reembolso reduz os indicadores de caixa e remuneração do período correspondente, conforme a regra de estorno.

### Cenários de conversão

1. Lead cadastrado sem call realizada não entra no denominador.
2. No-show não entra no denominador.
3. Desqualificado sem call realizada não afeta a conversão.
4. Call realizada entra no denominador.
5. Venda associada à call realizada entra no numerador.
6. Reembolso deve aparecer separadamente e não ser confundido com venda ativa.

### Cenários de permissões

1. Closer não acessa leads de outro closer.
2. Closer não consulta vendas de outro closer.
3. Administrador visualiza todos os registros.
4. Tentativa de acessar registro não autorizado é bloqueada no backend.

### Cenários de ciclo de vida

1. Lead excluído e recadastrado inicia novo ciclo.
2. Lead reativado não preserva histórico anterior.
3. No-show é contabilizado por ocorrência dentro do ciclo.
4. Venda excluída gera reembolso e etapa Reembolso.
5. Operações financeiras são auditadas.

---

# 11. EXPERIÊNCIA E QUALIDADE

A interface deverá ser:

- Responsiva.
- Rápida.
- Consistente.
- Intuitiva.
- Acessível.
- Adequada para uso diário.

Preserve o comportamento visual do HTML em telas grandes e pequenas.

Inclua:

- Loading states.
- Empty states.
- Mensagens de sucesso e erro.
- Confirmações para ações destrutivas.
- Validação clara de formulários.
- Feedback de operações.
- Paginação quando necessário.
- Busca e filtros.
- Estados de carregamento e falha da API.

Não deixe botões sem funcionalidade.

Não crie telas com dados estáticos fingindo que são registros reais.

---

# 12. PLANO DE EXECUÇÃO

Trabalhe em fases.

### Fase 1 — Auditoria e planejamento

- Ler o HTML integralmente.
- Mapear módulos e comportamentos.
- Produzir `REFERENCE_AUDIT.md`.
- Documentar regras de negócio.
- Desenhar modelo de dados.
- Apresentar a arquitetura.

### Fase 2 — Estrutura e autenticação

- Criar frontend e backend.
- Configurar MySQL.
- Implementar Sanctum.
- Criar usuários e permissões.
- Criar estrutura de empresas e gerências.

### Fase 3 — CRM

- Pipeline.
- Cadastro de leads.
- Lead 360.
- Qualificação BANT.
- Histórico.
- No-show.
- Loss e Desqualificado.

### Fase 4 — Financeiro

- Empresas e gerências.
- Vendas.
- Pagamentos.
- Faturamento.
- Caixa.
- Comissões.
- Reembolsos.
- Auditoria financeira.

Esta fase exige testes específicos antes de avançar.

### Fase 5 — Produtividade comercial

- Cadência.
- Follow-ups.
- Scorecard.
- Objeções.
- Histórico de calls.

### Fase 6 — Metas e dashboards

- Hoje.
- Ritmo.
- Metas mensais.
- Regra de remuneração TZN Legacy.
- Relatórios.
- Indicadores consolidados.

### Fase 7 — Acabamento e validação

- Revisão visual comparando com o HTML.
- Testes completos.
- Correção de bugs.
- Testes de permissões.
- Testes financeiros.
- Revisão de responsividade.
- Documentação de instalação e operação.

Ao fim de cada fase, executar testes e corrigir os problemas antes de avançar.

---

# 13. CRITÉRIOS DE ACEITAÇÃO

O projeto somente poderá ser considerado concluído quando:

1. Todos os módulos do HTML tiverem sido reproduzidos.
2. A identidade visual estiver fiel à referência.
3. Frontend e backend estiverem separados.
4. A autenticação estiver funcionando.
5. As permissões estiverem funcionando no backend.
6. Os dados forem persistidos no MySQL.
7. O pipeline permitir movimentação funcional.
8. O Lead 360 possuir histórico e qualificação.
9. As calls e scorecards forem persistidos.
10. Os follow-ups forem gerenciáveis.
11. As objeções possuírem indicadores reais.
12. Faturamento e caixa estiverem separados corretamente.
13. Pagamentos pendentes puderem ser baixados posteriormente.
14. A regra de comissão estiver funcionando.
15. O reembolso estiver funcionando com estorno e auditoria.
16. A regra de 70% e 100% do fixo estiver funcionando.
17. As metas mensais estiverem funcionando.
18. Os indicadores de conversão considerarem somente calls realizadas.
19. Os testes financeiros e de permissões estiverem aprovados.
20. A documentação de instalação e uso estiver pronta.

---

# 14. INSTRUÇÃO FINAL AO AGENTE

Não tente entregar tudo de uma vez de forma superficial.

Construa uma aplicação real, com arquitetura limpa e regras de negócio centralizadas.

O HTML anexado é a referência obrigatória de aparência e comportamento. Analise-o integralmente e reproduza o que existe nele, respeitando as alterações e regras deste prompt.

**Não simplifique os módulos, não invente regras financeiras e não substitua a interface por um template genérico.**

Se encontrar alguma ambiguidade que altere cálculos, remuneração, conversão, reembolso, permissões ou integridade dos dados, pare e pergunte antes de decidir.

Quando terminar, entregue:

- Aplicação funcional.
- Código organizado em `frontend/` e `backend/`.
- Banco de dados e migrations.
- Seeders iniciais.
- Testes automatizados.
- Documentação de instalação.
- Credenciais de acesso de desenvolvimento.
- Relatório do que foi implementado.
- Lista de eventuais pendências.

A prioridade é entregar um **Closer OS Pro fiel à referência, confiável financeiramente e pronto para uso real**.