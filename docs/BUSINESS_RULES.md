# BUSINESS_RULES — Closer OS Pro

## Autenticação e permissões
- Perfis: admin, closer.
- Admin vê tudo; closer vê apenas seus registros.
- Permissões validadas no backend (Policies).

## Leads
- 5 campos: name, phone, email, description, call_at.
- Telefone normalizado BR; duplicado gera aviso, não bloqueio.
- Descrição pessoal separada da descrição da venda.

## Pipeline
- Etapas: lead_agendado, no_show, fup, remarcado, negociacao, fechado, loss, desqualificado.
- Fechado exige venda (transação). Cancelar modal mantém etapa anterior.
- Loss/Desqualificado exige motivo + nota opcional.
- No-show incrementa contador no ciclo.
- Fechado bloqueado para saída manual; cancelar venda (admin) reabre em negociação.
- Toda mudança grava lead_event.
- Exclusão de lead remove dados e histórico; recadastro = novo lead.
- Reativação de loss/desqualificado cria novo ciclo sem histórico; no-show reinicia.

## Financeiro
- Formas de pagamento: Pix, Cartão, Boleto. (Sem contrato — prompt master.)
- Pix/Cartão: status pago ou pendente.
- Boleto: sempre pago, sem caixa, sem data recebimento, sem taxa.
- Faturamento = soma de todos os pagamentos.
- Caixa bruto = pix+cartão pagos.
- Caixa líquido = caixa bruto - taxas gateway (cartão).
- A receber = pix+cartão pendentes.
- Caixa no período por received_at; faturamento por closed_at.
- Comissão = caixa líquido elegível × percentual (snapshot na venda).
- Percentual congelado no fechamento.
- Reembolso ao excluir venda: 100% do valor, preserva venda original, estorna faturamento e caixa recebido, reverte comissão, cancela pendentes, move lead para Reembolso, auditável, atômico.
- Valores em centavos (inteiros).

## Conversão
- Taxa = vendas / calls realizadas × 100.
- Denominador: apenas calls realizadas. Não contar leads cadastrados/agendados/no-show/desqualificados sem call.
- Loss e Desqualificado indicadores separados.

## Remuneração TZN Legacy
- Empresa TZN Legacy, meta mensal caixa R$ 18.000, fixo integral R$ 1.800, marco 70%.
- Caixa < 70%: fixo 0; 70%..99.99%: R$ 900; >=100%: R$ 1.800.
- + comissões normalmente.
- Caixa efetivamente recebido no mês (received_at), não data de fechamento.
- Configuração histórica por mês (snapshot).

## No-show métricas
- Calls agendadas = leads com call_at no período.
- No-shows = leads com ao menos um evento no_show no período.
- Taxa no-show = no-shows / calls agendadas.
- Recuperados = no-show que hoje estão em remarcado/fup/negociacao/fechado.
- Taxa desqualificação = desqualificados / leads do período.

## BANT
- 4 critérios × 20 = 80; engajamento até 20; total 100.
- Temperatura: >=70 quente, >=40 morno, <40 frio.

## Scorecard calls
- 8 critérios com pesos (total 100).
- Proporção de fala: ideal 30-50%. Penalidade 0 se 30-50, 5 se 20-60 (fora do ideal mas dentro), 10 fora.
- Persistido por call.

## Objeções
- 6 objeções iniciais com referências de conversão (estáticas iniciais).
- Módulo gerenciável: cadastrar/editar, respostas, registrar ocorrência associada a call/lead, contornado, venda.
- Indicadores reais calculados.

## Cadência FUP
- Biblioteca de mensagens por situação (pos-call, proposta, no-show, frio).
- Gestão de follow-ups: criar, associar lead, data/hora, mensagem, marcar concluído, resultado, histórico, atrasados, próximos.

## Metas
- Metas mensais por closer/empresa/gerência: calls agendadas, realizadas, vendas, faturamento, caixa, comissões, outras.
- Percentual atingido, quanto falta, projeção, histórico.

## Empresas/gerências
- Empresas, gerências/unidades, closer vinculado, metas por empresa/gerência, regras de comissão por empresa/gerência.
- Inicial: TZN Legacy; gerências Mercado Livre, Visagismo.
