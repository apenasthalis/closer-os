# DECISIONS — Closer OS Pro

1. Formas de pagamento: apenas Pix, Cartão e Boleto (prompt master §6.1). “Contrato”, presente no HTML, não foi implementado.
2. Boleto é sempre pago, não compõe caixa, não tem data de recebimento nem taxa.
3. Comissão incide sobre caixa líquido (Pix/Cartão pagos menos taxa), reconhecida por `received_at`.
4. Cada lead tem no máximo uma venda.
5. `user_id` em leads, vendas, calls e metas prepara o sistema para equipes, embora o seed comece com um admin e um closer local.
6. Laravel 13 + PHP 8.3, MySQL 8 e Sanctum SPA.
7. Dinheiro em centavos (`BIGINT`); datas UTC no banco e `America/Sao_Paulo` na interface.
8. Excluir venda sempre gera reembolso de 100%, preserva a venda para auditoria e move o lead para `reembolso`. Lead com venda não pode ser excluído.
9. Reativar loss/desqualificado cria novo ciclo sem apagar o histórico; no-show reinicia o contador.
10. Scorecard é persistido por call.
11. Objeções iniciais são referências; indicadores reais vêm das ocorrências registradas.
12. Operação com venda só pode ser arquivada.
13. Percentual de comissão fica congelado na venda (`sales.commission_percent`).
14. Faturamento por `closed_at`; caixa por `received_at`.
15. Remuneração TZN usa configuração histórica e snapshot mensal para preservar meses anteriores.
16. O frontend nunca recalcula valores oficiais; apenas mostra prévias com as mesmas fórmulas do backend.
17. Etapa `reembolso` é sistêmica: não pode ser destino/origem de movimentação manual; só o fluxo de reembolso altera essa etapa.
18. `call_objections.call_id` é nullable para registrar objeções de lead sem call vinculada.
