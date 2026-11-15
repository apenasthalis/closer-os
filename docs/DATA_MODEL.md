# DATA_MODEL — Closer OS Pro

Valores monetários em centavos (`BIGINT`). Datas UTC no banco; exibição em `America/Sao_Paulo`.

## users
id, name, email (unique), password, role (`admin|closer`), active (bool), timestamps.

## companies / departments / user_company_assignments
- `companies`: id, name, archived_at, timestamps.
- `departments`: id, company_id FK, name, archived_at, timestamps; unique(company_id, name).
- `user_company_assignments`: id, user_id, company_id, department_id nullable, timestamps.

## operations
id, company_id nullable, department_id nullable, name, commission_percent (5,2), archived_at nullable, timestamps.

## leads
id, user_id (closer), company_id/department_id nullable, name, phone, email, description, call_at, stage, stage_changed_at, no_show_count, loss_reason, loss_note, qualification JSON (`budget`, `authority`, `need`, `timing`), timestamps.
Índices: (user_id, stage), call_at.

## lead_events
id, lead_id, type (`created|edited|stage_changed|no_show|note|sale_saved|sale_cancelled|refund|reactivated`), from_stage, to_stage, payload JSON, actor_user_id, created_at.

## calls / call_scorecards
- `calls`: id, user_id, lead_id nullable, company_id/department_id nullable, call_at, status (`held|no_show|scheduled`), notes, timestamps.
- `call_scorecards`: id, call_id unique, criteria JSON, talk_ratio, penalty, score, timestamps.

## objections / call_objections
- `objections`: id, name, category, suggested_response, reference_conversion (5,2), archived_at, timestamps.
- `call_objections`: id, call_id nullable (nullOnDelete), objection_id, lead_id nullable, closer_user_id nullable, resolved, sale_happened, notes, timestamps.

## sales / sale_payments / refunds
- `sales`: id, lead_id unique, user_id, company_id/department_id/operation_id nullable, description, closed_at, commission_percent (snapshot), receipt_path, timestamps.
- `sale_payments`: id, sale_id, method (`pix|card|boleto`), amount_cents, installments, gateway_fee_cents, status (`paid|pending`), received_at nullable, timestamps.
- `refunds`: id, sale_id unique, actor_user_id, company_id/department_id/closer_user_id nullable, amount_cents, cash_refunded_cents, commission_reversed_cents, payments_snapshot JSON, refunded_at, reason, timestamps.

## follow_up_templates / follow_up_tasks
- `follow_up_templates`: id, user_id nullable, situation, day_label, title, body, timestamps.
- `follow_up_tasks`: id, lead_id, user_id, scheduled_at, message, status (`pending|done`), result, completed_at, timestamps.

## goals
id, user_id, company_id, department_id nullable, month (primeiro dia), metric (`calls_scheduled|calls_held|sales|revenue_cents|cash_cents|commission_cents`), target_value, timestamps; unique(user_id, company_id, department_id, month, metric).

## compensation_rules / commissions / monthly_compensation_snapshots
- `compensation_rules`: id, company_id, department_id nullable, name, monthly_cash_target_cents, full_fixed_cents, intermediate_percent, intermediate_fixed_cents, effective_from, effective_to nullable, timestamps.
- `commissions`: id, sale_id, user_id, company_id/department_id nullable, period_month, base_cents, percent, amount_cents, reversed_cents, timestamps; unique(sale_id, period_month).
- `monthly_compensation_snapshots`: id, user_id, company_id/department_id nullable, month, cash_received_cents, target_cents, intermediate_percent, full_fixed_cents, intermediate_fixed_cents, fixed_cents, commission_cents, total_cents, rule_id nullable, timestamps; unique(user_id, company_id, department_id, month).

## audit_logs
id, actor_user_id nullable, action, entity_type, entity_id, payload JSON, created_at.

## Integridade
- Lead → closer, empresa/gerência. Sale → lead (uma por lead), operação. Payment → sale. Refund → sale. Scorecard → call. Follow-up → lead. Goal → closer/empresa/gerência.
- Venda com reembolso permanece; lead correspondente não pode ser excluído.
- Operação com venda só pode ser arquivada, nunca apagada.
