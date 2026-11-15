# API — Closer OS Pro

Base: `/api/v1`. Auth: Laravel Sanctum SPA (cookie). Todos endpoints autenticados exceto login.

## Auth
- POST /auth/login {email,password}
- POST /auth/logout
- GET /me

## Users (admin)
- GET/POST /users, GET/PATCH/DELETE /users/{id}

## Companies
- GET/POST /companies, GET/PATCH/DELETE /companies/{id}

## Departments
- GET/POST /departments?company_id, GET/PATCH/DELETE /departments/{id}

## Operations
- GET/POST /operations, PATCH /operations/{id}, POST /operations/{id}/archive

## Leads
- GET /leads (q, stage, call_from, call_to, user_id admin)
- POST /leads
- GET /leads/{id} (inclui events, qualification, sale)
- PATCH /leads/{id} (5 campos)
- DELETE /leads/{id}
- POST /leads/{id}/transition {stage, loss_reason?, loss_note?, sale?}
- PATCH /leads/{id}/qualification {budget,authority,need,timing}
- POST /leads/{id}/notes {note}

## Calls / Scorecards
- GET/POST /calls
- GET /calls/{id}
- POST /calls/{id}/scorecard
- GET /scorecards/{id}

## Objections
- GET/POST /objections, PATCH/DELETE /objections/{id}
- POST /objections/{id}/occurrences {call_id, lead_id, resolved, sale_happened}

## Follow-ups
- GET/POST /follow-ups (templates: /follow-up-templates)
- PATCH /follow-ups/{id}, POST /follow-ups/{id}/complete {result}

## Sales
- GET /sales (from,to,q,operation_id)
- GET/PATCH /sales/{id}
- DELETE /sales/{id} (cancela venda, gera reembolso, reabre lead) admin
- POST /sales/{id}/payments
- PATCH /sales/{id}/payments/{paymentId}
- POST /sales/{id}/receipt (upload)

## Refunds
- GET /refunds (filtros)
- GET /refunds/{id}

## Finance
- GET /metrics/finance?from&to&q&operation_id (faturamento, caixa líquido, a receber, ticket médio, comissão, série mensal, total por operação)

## Pipeline metrics
- GET /metrics/pipeline?from&to (calls agendadas, no-shows, taxa, recuperados, desqualificados, taxa, funil, mapa dia semana)

## Goals
- GET/POST /goals, PATCH/DELETE /goals/{id}

## Compensation
- GET/POST /compensation-rules, PATCH /compensation-rules/{id}
- GET /compensation?user_id&month (calcula fixo+comissões)

## Reports
- GET /reports/conversion, /reports/losses, /reports/objections, /reports/calls

## Audit
- GET /audit-logs (admin)
