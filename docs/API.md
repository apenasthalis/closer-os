# API — Closer OS Pro

Base: `/api/v1`. Auth: Laravel Sanctum. Todos endpoints exigem sessão autenticada, exceto login.

## Auth e usuários
- POST /auth/login `{email,password}`; POST /auth/logout; GET /me
- GET/POST /users, PATCH/DELETE /users/{id} (admin)

## Empresas, gerências e operações
- GET/POST /companies, PATCH/DELETE /companies/{id}
- GET/POST /departments?company_id, PATCH/DELETE /departments/{id}
- GET/POST /operations, PATCH/DELETE /operations/{id}
- POST /operations/{id}/archive

## Leads e pipeline
- GET /leads (`q`, `stage`, `call_from`, `call_to`, `user_id` admin, paginação)
- POST /leads; GET/PATCH/DELETE /leads/{id}
- GET /leads/{id}/timeline
- POST /leads/{id}/transition `{stage, loss_reason?, loss_note?, sale?}`
- PATCH /leads/{id}/qualification `{budget,authority,need,timing}`
- POST /leads/{id}/notes `{note}`
- POST /leads/{id}/reactivate
- GET /pipeline/board
- GET /metrics/pipeline?from&to&user_id
- GET /dashboard/today

## Vendas, pagamentos e reembolsos
- GET/POST /sales (`from`, `to`, `q`, `operation_id`)
- GET/PATCH/DELETE /sales/{id} — DELETE = reembolso admin, preserva a venda
- GET /sales/{id}/refund
- GET /sales/refunds?from&to&operation_id
- POST /sales/{id}/payments; PATCH /sales/{id}/payments/{paymentId}
- POST /sales/{id}/payments/{paymentId}/pay
- POST /sales/{id}/receipt (multipart)

## Financeiro, metas e remuneração
- GET /metrics/finance?from&to&q&operation_id
- GET /metrics/conversion?from&to&user_id
- GET /reports/overview?from&to
- GET/POST /goals, PATCH/DELETE /goals/{id}
- GET /compensation-rules, POST /compensation-rules, PATCH/DELETE /compensation-rules/{id}
- GET /compensation?user_id&month
- GET /compensation/history?user_id&from&to

## Calls e scorecards
- GET /calls?from&to&status&user_id; POST /calls; GET/PATCH/DELETE /calls/{id}
- GET /calls/criteria
- GET /calls/stats?from&to&user_id
- POST /calls/{id}/scorecard `{criteria?, talk_ratio}`

## Objeções
- GET /objections, POST /objections, PATCH/DELETE /objections/{id}
- GET /objections/stats?from&to&user_id
- GET /objections/occurrences?from&to&user_id
- POST /objections/occurrences `{objection_id,call_id?,lead_id?,resolved?,sale_happened?,notes?}`

## Cadência FUP
- GET/POST /follow-up-templates, PATCH/DELETE /follow-up-templates/{id}
- GET /follow-ups/summary
- GET /follow-ups (`status`, `lead_id`, `lead_stage`, `from`, `to`, `sort`, `dir`)
- POST /follow-ups `{lead_id, scheduled_at, message, status?, result?, had_response?, completed_at?}`
- PATCH /follow-ups/{id} `{lead_id?, scheduled_at?, message?, status?, result?, had_response?, completed_at?}`
- POST /follow-ups/{id}/complete `{result?, had_response?, completed_at?}`
- DELETE /follow-ups/{id}

## Auditoria
- GET /audit-logs?action&entity_type&actor_user_id&from&to (admin)
