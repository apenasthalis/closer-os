# Closer OS Pro

CRM comercial com pipeline, vendas, faturamento/caixa, comissões, reembolsos, metas, calls, objeções, cadência e dashboards.

## Estrutura

- `frontend/` — React + Vite + TypeScript
- `backend/` — Laravel 13 + PHP 8.3 + MySQL 8
- `docs/` — regras, modelo de dados, API, decisões e auditoria da referência

## Backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
# configure MySQL 8 no .env
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```

Credenciais iniciais:
- Admin: `1thalisgabriel1@gmail.com` / `123456`
- Closer local: `closer@closeros.test` / `password`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite faz proxy de `/api` e `/sanctum` para o backend na porta 8000.

## Testes

```bash
cd backend && php artisan test
cd frontend && npm run build
cd frontend && npm run lint
```

Testes de backend usam MySQL 8 separado (`closeros_test`, porta 3307 no ambiente local).
