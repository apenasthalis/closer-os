# DATA_MODEL — Closer OS Pro

Valores monetários em centavos (BIGINT). Datas UTC no banco, exibir America/Sao_Paulo.

## users
id, name, email, password, role (admin|closer), timestamps.

## companies
id, name, timestamps.

## departments (business_units)
id, company_id FK, name, timestamps.

## user_company_assignments
id, user_id FK, company_id FK, department_id FK nullable, timestamps.

## operations (comissão por operação)
id, user_id, company_id nullable, department_id nullable, name, commission_percent (decimal 5,2), archived_at nullable, timestamps.

## leads
id, user_id (closer responsável), company_id nullable, department_id nullable, name, phone, email, description (text), call_at (datetime), stage (enum), stage_changed_at, no_show_count (int), loss_reason, loss_note, qualification (json: budget,authority,need,timing), timestamps.
Indexes: (user_id, stage), (call_at).

## lead_events
id, lead_id FK, type (created, edited, stage_changed, no_show, note, sale_saved, sale_cancelled, refund), from_stage, to_stage, payload (json), actor_user_id, created_at.
Index (lead_id, created_at).

## calls
id, user_id, lead_id FK, company_id, department_id, call_at, scorecard_id, timestamps.

## call_scorecards
id, call_id FK, criteria (json), talk_ratio, score (int), timestamps.

## call_objections
id, call_id FK, objection_id FK, lead_id FK, closer_user_id, resolved (bool), sale_happened (bool), timestamps.

## objections
id, name, category, suggested_response (text), reference_conversion (decimal), timestamps.

## sales
id, lead_id (unique) FK, user_id (closer), company_id, department_id, operation_id FK, description (text), closed_at (date), commission_percent (decimal 5,2 snapshot), receipt_path nullable, timestamps.
Index (closed_at), (user_id).

## sale_payments
id, sale_id FK, method (pix|card|boleto), amount_cents (bigint), installments (int), gateway_fee_cents (bigint), status (paid|pending), received_at (date nullable), timestamps.
Index (received_at).

## refunds
id, sale_id FK (original), user_id (actor), company_id, department_id, closer_user_id, amount_cents, refunded_at (date), reason, timestamps.

## follow_up_templates
id, user_id, situation, title, body, timestamps.

## follow_up_tasks
id, lead_id FK, user_id, scheduled_at (datetime), message (text), status (pending|done), result (text nullable), completed_at, timestamps.

## goals
id, user_id (closer), company_id, department_id nullable, month (date first day), metric (string), target (bigint/decimal), timestamps.
Unique (user_id, company_id, department_id, month, metric).

## compensation_rules
id, company_id, department_id nullable, name, monthly_cash_target_cents, full_fixed_cents, intermediate_percent (decimal), intermediate_fixed_cents, effective_from (date), effective_to (date nullable), timestamps.

## commissions (snapshot por venda/período)
id, sale_id FK, user_id (closer), company_id, department_id, period_month (date), amount_cents, timestamps.

## monthly_compensation_snapshots
id, user_id, company_id, department_id, month, cash_received_cents, target_cents, fixed_cents, commission_cents, total_cents, rule_id FK, timestamps.

## pipeline_stage_events (= lead_events type stage_changed)

## audit_logs
id, actor_user_id, action, entity_type, entity_id, payload (json), created_at.

## Integridade
- Lead → closer (user). Sale → lead, operation. Payment → sale. Refund → sale. Scorecard → call. Follow-up → lead. Goal → company/department/closer.
- Exclusão de lead: cascade remove events/calls/scorecards/followups; venda? Prompt: venda excluída gera reembolso, não apaga. Lead excluído remove tudo (incluindo venda? "Se o lead for excluído, seus dados e histórico serão removidos." Implica venda também removida? Mas venda gera reembolso. Ambiguidade: priorizar prompt master: exclusão de venda gera reembolso; exclusão de lead remove dados. Registrar decisão: lead excluído remove lead e histórico, mas se houver venda, gera reembolso antes? Decisão: para simplificar, lead excluído remove lead e seus eventos; vendas associadas são canceladas gerando reembolso (admin). Registrar.)
