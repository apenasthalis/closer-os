# BUSINESS_RULES — Closer OS Pro

## Autenticação e permissões
- Perfis: admin e closer. Admin vê tudo; closer vê somente seus leads, calls, vendas, metas e comissões.
- Permissões são validadas no backend (Policies); o frontend apenas oculta ações.

## Leads
- Campos editáveis: nome, telefone, e-mail, descrição pessoal e data/hora da call.
- Telefone brasileiro normalizado; duplicidade gera aviso, não bloqueia.
- Descrição pessoal do lead é separada da descrição da venda.
- Lead com venda associada não pode ser excluído. Para encerrar, faça o reembolso da venda (a venda permanece para auditoria; o lead vai para `reembolso`).
- Exclusão definitiva só para lead sem venda; remove dados e histórico.

## Pipeline
- Etapas: `lead_agendado`, `no_show`, `fup`, `remarcado`, `negociacao`, `fechado`, `reembolso`, `loss`, `desqualificado`.
- Mover para `fechado` abre o modal de venda e exige criação transacional da venda. Cancelar o modal mantém a etapa anterior.
- `fechado` não pode ser movido manualmente para outra etapa.
- `reembolso` é etapa sistêmica: não pode ser destino manual nem origem de movimentação manual.
- Loss/Desqualificado exigem motivo; nota é opcional.
- No-show incrementa `no_show_count`. Reativação de loss/desqualificado cria novo ciclo sem apagar o histórico anterior; no-show reinicia o contador.
- Toda mudança de etapa grava `lead_event` e auditoria.

## Financeiro
- Formas de pagamento: Pix, Cartão e Boleto. Não existe modalidade “contrato”.
- Pix/Cartão: status pago ou pendente.
- Boleto: sempre pago, sem caixa, sem `received_at`, sem taxa de gateway.
- Faturamento = soma de todos os pagamentos da venda.
- Caixa bruto = Pix + Cartão pagos.
- Caixa líquido = caixa bruto − taxas de gateway.
- A receber = Pix + Cartão pendentes.
- Faturamento reconhecido por `closed_at`; caixa por `received_at`.
- Comissão = caixa líquido elegível × percentual congelado na venda.
- Valores monetários em centavos inteiros; nunca float.

## Reembolso
- Excluir uma venda gera reembolso de 100% de forma atômica, apenas para admin.
- A venda original e seus pagamentos são preservados; pagamentos pendentes são cancelados.
- O reembolso estorna faturamento e caixa recebido, reverte a comissão e move o lead para `reembolso`.
- Reembolso é único por venda e registra snapshot dos pagamentos, valores estornados e ator.

## Conversão
- Taxa = vendas ativas (não reembolsadas) ÷ calls realizadas × 100.
- Denominator: apenas calls com status `held`. No-shows, agendados sem call, loss e desqualificados sem call não entram.
- Loss e Desqualificado são indicadores separados.

## Remuneração TZN Legacy
- Meta mensal de caixa R$ 18.000; fixo integral R$ 1.800; marco intermediário 70% com R$ 900.
- Caixa abaixo de 70%: fixo R$ 0. De 70% a 99,99%: R$ 900. Em 100% ou mais: R$ 1.800.
- Comissões somam-se ao fixo. Caixa considera `received_at` no mês, menos reembolsos.
- Regra vigente e snapshot mensal preservam o histórico.

## No-show e funil
- Calls agendadas = leads com `call_at` no período.
- No-shows = leads com evento `no_show` no período.
- Taxa de no-show = no-shows ÷ calls agendadas.
- Recuperados = no-show que hoje estão em `remarcado`, `fup`, `negociacao` ou `fechado`.
- Taxa de desqualificação = desqualificados ÷ leads do período.

## BANT
- 4 critérios × 20 = 80 pontos; engajamento na timeline adiciona até 20; total 100.
- Temperatura: ≥70 quente, ≥40 morno, <40 frio.

## Scorecard de calls
- 8 critérios com pesos que somam 100.
- Proporção de fala ideal 30–50%. Penalidade 0 no ideal, 5 em 20–60% e 10 fora dessa faixa.
- Scorecard é persistido por call e usado nos indicadores de qualidade.

## Objeções
- Seis objeções iniciais servem como referência; o módulo permite cadastrar, editar e arquivar.
- Ocorrência pode ser vinculada a call e/ou lead, com contorno e venda associada.
- Indicadores reais são calculados a partir das ocorrências, não das referências estáticas.

## Cadência FUP
- Biblioteca de mensagens por situação, com rótulo de dia (`D0`, `D1`, …).
- Tarefas têm lead, responsável, data/hora, mensagem, status pendente/concluída e resultado.
- Indicadores incluem atrasados, próximos e taxa de conclusão.

## Metas
- Metas mensais por closer/empresa/gerência: calls agendadas, calls realizadas, vendas, faturamento, caixa e comissão.
- Exibem atingimento, falta, projeção e histórico.

## Empresas e gerências
- Empresas contêm gerências/unidades; operações definem percentual de comissão.
- Seed inicial: TZN Legacy, com gerências Mercado Livre e Visagismo.
