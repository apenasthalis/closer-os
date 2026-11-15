# DECISIONS — Closer OS Pro

1. Formas de pagamento: apenas Pix, Cartão, Boleto (prompt master §6.1). Contrato (presente no HTML/PROMPT_MD embutido) não implementado, conforme regra do prompt master. Motivo: prompt master tem prioridade hierárquica.

2. Boleto: sempre pago, sem caixa, sem data de recebimento, sem taxa (align prompt master e PROMPT_MD).

3. Comissão incide sobre caixa líquido (depois taxa gateway), reconhecida conforme caixa entra (received_at).

4. Um lead tem no máximo uma venda.

5. Sistema começa com um usuário; user_id nas tabelas para equipes futuras.

6. Laravel 13 (disponível no ambiente) em vez de 12; MySQL 8 via Docker. Sanctum para auth SPA.

7. Money em centavos (bigint). Datas UTC no banco, exibir America/Sao_Paulo.

8. Lead excluído: remove dados/histórico. Se houver venda associada, gera reembolso (admin) antes da remoção para manter auditoria financeira.

9. Reativação de loss/desqualificado cria novo ciclo sem histórico anterior; no-show reinicia.

10. Scorecard persistido por call (não apenas avaliação temporária).

11. Objeções iniciais (6) tratadas como referências iniciais; indicadores reais calculados.

12. Operações com vendas não podem ser apagadas, apenas arquivadas.

13. Percentual de comissão congelado na venda (snapshot commission_percent).

14. Faturamento por closed_at; caixa por received_at.

15. Remuneração TZN: configuração histórica por mês (snapshot) para não alterar meses anteriores.

16. Frontend nunca recalcula valores oficiais; apenas prévia em tempo real no modal usando mesmas fórmulas.
