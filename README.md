# SiteParana Next (eParana)

Projeto Next.js com App Router, Prisma e PWA. Interface replicada do site original e preparada para uso comercial.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind (instalado; estilos atuais em CSS legado)
- Autenticacao (Supabase)
- Postgres + Prisma
- Scraper Python (FastAPI)

## Requisitos
- Node.js 20+
- Postgres
- Conta Supabase
- Python 3.11+ (para o scraper)

## Setup (Next.js)
1) Instale dependencias:
```bash
npm install
```

2) Configure variaveis de ambiente:
```bash
cp .env.example .env
```

3) Configure o banco e rode migrations:
```bash
npx prisma migrate dev --name init
```

4) Seed inicial (opcional):
```bash
npx prisma db seed
```

5) Suba o projeto:
```bash
npm run dev
```

## Autenticacao
- Configure a autenticacao via Supabase quando conectar o banco.

## Scraper Python
O scraper fica em `scraper-python/`.

### Instalar dependencias
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Executar
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Endpoints
- `GET /health`
- `POST /run/ibge`
- `POST /run/tse`
- `POST /run/all`

Defina `SCRAPER_SERVICE_URL` no Next apontando para esse servico.

## Cron
Use o endpoint `POST /api/sync/cron` com `INTERNAL_CRON_SECRET`.
Exemplo (Vercel Cron):

```bash
curl -X POST "https://seu-dominio.vercel.app/api/sync/cron?secret=SEU_SEGREDO"
```

## Deploy
### Next.js (Vercel)
- Configure as env vars do `.env.example`.
- Rode `npx prisma migrate deploy` no ambiente.

### Scraper (Render/Fly)
- Suba `scraper-python` como servico web.
- Configure `DATABASE_URL`.

## Observacoes
- PWA usa `public/manifest.json` e `public/service-worker.js`.
- A tela inicial do sistema redireciona para `/home`.
