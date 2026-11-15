# Closer OS Pro

CRM comercial completo com pipeline, vendas, faturamento/caixa, comissões, reembolsos, metas e dashboards.

## Estrutura

- `frontend/` — React + Vite + TypeScript
- `backend/` — Laravel 13 + PHP 8.3
- `docs/` — auditoria, regras, modelo de dados, API, decisões

## Setup backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
# configure MySQL em .env
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```

Credenciais dev: admin@closeros.test / password, closer@closeros.test / password.

## Setup frontend

```bash
cd frontend
npm install
npm run dev
```

Vite faz proxy de /api e /sanctum para o Laravel (porta 8000).

## Testes

```bash
cd backend && php artisan test
cd frontend && npm run build
```

## MySQL

Use MySQL 8. Configure .env. Para dev local pode usar Postgres (driver pdo_pgsql) alterando DB_CONNECTION.
