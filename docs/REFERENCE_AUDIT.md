# REFERENCE_AUDIT — Closer OS Pro

Fonte: `Closer OS Pro.html` (913 linhas) + `prompt.md` (PROMPT MASTER).

## 1. Módulos identificados (navegação lateral)

1. Hoje (dashboard do dia)
2. Faturamento e caixa (financeiro)
3. Pipeline (Kanban)
4. Lead 360
5. Cadência de FUP
6. Scorecard de calls
7. Banco de objeções
8. Perdas e recuperação
9. Metas e ritmo
10. Operações e comissão (Configurações)
11. Prompt do agente (Documentação)

## 2. Identidade visual

- Fundo `#070a08`, superfície `#0e1311`, raise `#151c18`, linha `#212b26`.
- FG `#f1f6f3`, muted `#8c9a92`, accent `#1ed760`, warn `#f2b441`, crit `#ff6159`, info `#58b4ff`.
- Fontes: Space Grotesk (títulos), Inter (corpo). Dark default + light theme.
- Cards borda 14px, chips, pills, kanban 8 colunas.
- Layout 230px sidebar + main, responsivo (mobile nav horizontal).

## 3. Componentes e interações

- Sidebar nav com grupos (Operação, Inteligência comercial, Configurações, Documentação).
- Head com título/subtítulo/ações + status chip.
- KPI grid, cards, rows, kanban columns/cards, modais (lead, sale, motivo).
- Drag & drop kanban (desktop), select mover (mobile/coarse).
- Filtros por período, busca, operação.
- Toast, empty states.

## 4. Formulários e campos

### Lead (5 campos)
- nome (obrigatório), telefone, email, descrição pessoal, data/hora da call.

### Venda / Pagamentos
- operação, data de fechamento, lista de pagamentos (forma, valor, parcelas, taxa gateway, status pago/pendente, data recebimento), descrição da venda.

### Motivo Loss/Desqualificado
- motivo (lista), nota.

### Operações
- nome, percentual comissão.

### BANT
- 4 critérios booleanos (Budget, Authority, Need, Timing) + engajamento (timeline).

### Scorecard calls
- 8 critérios com pesos, proporção de fala (ratio).

### Cadência
- situação, nome do lead, mensagens copiáveis.

### Objeções
- 6 objeções estáticas iniciais + respostas.

## 5. Regras de negócio encontradas no HTML

- Pipeline etapas: lead_agendado, no_show, fup, remarcado, negociacao, fechado, loss, desqualificado.
- Mover para fechado abre modal de venda; cancelar mantém etapa anterior.
- Mover para loss/desqualificado exige motivo.
- No-show incrementa contador.
- Lead fechado não pode ser movido manualmente; excluir venda reabre em negociação.
- Faturamento = soma de todos os pagamentos.
- Caixa = pix/cartão pagos, menos taxa gateway (cartão).
- Boleto/contrato: sempre pago, sem caixa.
- Comissão = caixa líquido × pct da operação (snapshot na venda).
- Caixa por período reconhecido por received_at; faturamento por closed_at.
- Conversão = vendas / calls realizadas.
- No-show métricas por período de call_at.
- Desqualificados não prejudicam conversão.
- Exclusão de lead remove dados; reativação cria novo ciclo sem histórico.
- Exclusão de venda gera reembolso (prompt master).
- Permissões por usuário (closer vê seus dados).

## 6. Diferenças entre HTML e prompt master

- HTML usa Firestore/localStorage e vanilla JS; reconstruir em React+Laravel+MySQL.
- HTML não tem auth/empresas/gerências/metas/remuneração TZN; prompt master adiciona.
- HTML tem 4 formas de pagamento? HTML tem pix, cartão, boleto, contrato (METODOS inclui contrato). Prompt master seção 6.1 diz apenas 3 formas (Pix, Cartão, Boleto) e "Não criar modalidade de contrato." Conflito: HTML tem Contrato. Hierarquia: regras do prompt prevalecem → apenas 3 formas. Mas prompt embutido (PROMPT_MD) diz 4 formas incluindo contrato. Prompt master (prompt.md) diz 3. Seguir prompt master: Pix, Cartão, Boleto. (Registrar em DECISIONS.)
- Prompt master adiciona reembolso obrigatório ao excluir venda (HTML apenas reabre lead).
- Prompt master adiciona remuneração TZN Legacy (70%/100%).
- Prompt master adiciona empresas/gerências, metas, scorecard persistido, objeções gerenciáveis, follow-ups gerenciáveis.
- HTML prompt embutido (PROMPT_MD) tem regras levemente diferentes (caixa líquido depois taxa, boleto/contrato sempre pago). Align com prompt master onde possível: boleto sempre pago, sem caixa.

## 7. Reprodução no novo sistema

- Frontend React+Vite+TS em /frontend, backend Laravel em /backend, MySQL.
- Tokens CSS reproduzidos.
- Todos os 10 módulos + auth/admin/empresas/gerências/metas.
- Regras financeiras no backend (SaleCalculator equivalente).
- Testes Pest/Vitest/Playwright.
