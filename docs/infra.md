# StockMiles — Infra

> ఈ file: stack, local setup, commands, folder layout. Stack లో ఏ మార్పు వచ్చినా ఇక్కడే update చేయాలి.
> చివరి update: 2026-11-27

## 0. స్థితి (2026-11-27)

| విషయం                                                                      | స్థితి                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Monorepo skeleton (api, web, shared)                                      | ✅ పూర్తి; `pnpm check`, 16 tests pass                                                                                                                                     |
| PWA (manifest, service worker, offline shell, update banner)              | ✅ పూర్తి; desktop Chrome లో offline test pass                                                                                                                              |
| Docker image                                                              | ✅ local గా build, run test pass                                                                                                                                          |
| Render deploy (D0)                                                        | ✅ Live: https://stockmiles.onrender.com; ✅ `main` కి push చేయగానే auto-deploy (2026-11-27 test: `480071e`, trigger `new_commit`)                                           |
| Phone test: iPhone 18 Pro Max, Safari (Add to Home Screen, airplane mode) | ✅ 2026-11-21 పూర్తి                                                                                                                                                       |
| Phone test: Android Chrome (Install app, airplane mode)                   | ⏳ మిగిలి ఉంది                                                                                                                                                               |
| GitHub repo private చేయటం                                                  | ⏳ మిగిలి ఉంది (ఇప్పుడు public)                                                                                                                                               |
| Local Postgres (Docker)                                                   | ✅ నడుస్తోంది; API health check దాన్ని వాడుతుంది                                                                                                                                 |
| Database layer                                                            | ✅ F1 health check; ✅ F2 Drizzle migrations + local-only guard + `users` table (local dev, test DBs; commit `39e77e2`); ⏳ Supabase కి `users` migrate (Veera, F4 ముందు) |
| Hosted database                                                           | ✅ Supabase (Singapore) Render కి connect అయింది; live `/api/health` → `db: ok` (2026-11-26)                                                                                |

## 1. Stack

| పొర              | Tool                                 | Version        | ఎందుకు                                                |
| --------------- | ------------------------------------ | -------------- | ----------------------------------------------------- |
| Runtime         | Node.js (nvm)                        | 24.22.3 LTS    | Dev, deploy రెండిటిలో ఒకటే (`.nvmrc` = `24`)               |
| Package manager | pnpm workspaces                      | 10.15.0        | Monorepo, ఒకే lockfile                                 |
| Language        | TypeScript                           | 7.0.2          | Native compiler; `tsc` type check కోసం మాత్రమే (`noEmit`) |
| Lint + format   | Biome                                | 2.6.8          | ESLint + Prettier బదులు ఒకే tool                       |
| Tests           | Vitest                               | 5.1.1          | Root లో ఒకే config, ప్రతి app/package ఒక project          |
| **Web**         | React, React DOM                     | 19.3.1         |                                                       |
|                 | Vite, @vitejs/plugin-react           | 8.3.8 / 6.3.0  | Dev server, `/api` proxy, production build            |
|                 | Tailwind CSS, @tailwindcss/vite      | 4.3.5          | CSS-first config (`@theme` in `index.css`)            |
|                 | React Router                         | 8.5.2          | SPA (`createBrowserRouter`)                           |
|                 | Zustand                              | 5.1.0          | Feature వారీ stores (install మాత్రమే, మొదటి feature లో వాడతాం)  |
|                 | react-hook-form, @hookform/resolvers | 7.92.0 / 7.0.8 | Forms + Zod validation (install మాత్రమే)                 |
|                 | vite-plugin-pwa, workbox-window      | 2.0.0 / 7.4.1  | PWA: manifest, service worker (§6)                    |
|                 | @vite-pwa/assets-generator           | 2.0.0          | `logo-mark.svg` (పాత project నుండి) నుండి app icons      |
| **API**         | Fastify                              | 5.12.8         | Long-running server                                   |
|                 | pino-pretty (dev)                    | 13.2.0         | Dev లో చదవగలిగే logs                                     |
|                 | @fastify/static                      | 10.1.12        | Production లో web build serve (§7)                     |
|                 | pg, @types/pg                        | 8.23.1         | Postgres driver (`src/db/client.ts` Pool)             |
|                 | Drizzle ORM                          | 0.45.4         | Schema (TypeScript), queries, migrator                |
|                 | drizzle-kit (dev)                    | 0.31.11        | Schema నుంచి `.sql` migrations generate (DB ని తాకదు)    |
| **Shared**      | Zod                                  | 4.6.7          | Web, API ఒకే schemas (`@stockmiles/shared`)            |
| Database        | PostgreSQL (Docker)                  | 17             | Local dev + test మాత్రమే                                 |

తర్వాత వచ్చేవి (వాడే module లోనే install చేస్తాం): @fastify/cookie (F4), uuid (UUIDv7), decimal.js.

**API కి build step లేదు.** Node 24 `.ts` files ని నేరుగా నడుపుతుంది (type stripping). అందుకే:

- imports లో `.ts` extension రాయాలి (`import { buildApp } from './app.ts'`).
- types మాత్రమే తీసేయగలిగే syntax వాడాలి (`erasableSyntaxOnly`): `enum`, `namespace`, constructor parameter properties వద్దు. `enum` బదులు `as const` object లేదా Zod enum.

## 2. మొదటిసారి setup

```bash
nvm install            # .nvmrc నుండి Node 24
npm install -g pnpm@10.15.0
pnpm install
cp .env.example .env
pnpm db:up             # Docker Postgres: stockmiles_dev, stockmiles_test
```

## 3. రోజువారీ commands (root నుండి)

| Command                                   | ఏమి చేస్తుంది                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                | API (http://localhost:3000) + web (http://localhost:5173) కలిసి, watch mode                                  |
| `pnpm test`                               | అన్ని Vitest tests                                                                                           |
| `pnpm check`                              | Biome (lint + format check) + ప్రతి package లో `tsc`                                                          |
| `pnpm format`                             | Biome తో format + imports సర్దుబాటు                                                                           |
| `pnpm build`                              | Web production build (`apps/web/dist`) + `sw.js`, `manifest.webmanifest`                                   |
| `pnpm --filter @stockmiles/web preview`   | Build ని http://localhost:4173 లో నడుపుతుంది; PWA ని test చేసే చోటు ఇదే                                            |
| `pnpm --filter @stockmiles/web pwa:icons` | `public/logo-mark.svg` మారినప్పుడు మాత్రమే: icons మళ్ళీ తయారు                                                       |
| `pnpm db:up` / `pnpm db:down`             | Local Postgres start / stop (data volume లో ఉంటుంది)                                                         |
| `pnpm db:generate`                        | `apps/api/src/db/schema/` నుంచి `apps/api/drizzle/*.sql` migration తయారు (DB ని తాకదు)                         |
| `pnpm db:migrate`                         | `.env` లోని `DATABASE_URL` కి migrations apply. Local మాత్రమే; hosted కి `MIGRATE_ALLOW_HOST=<host>` (Veera మాత్రమే) |
| `pnpm --filter @stockmiles/api <script>`  | ఒకే app లో script                                                                                            |

## 4. Ports, env

| ఏమిటి               | Port                                                         |
| ----------------- | ------------------------------------------------------------ |
| API (Fastify)     | 3000                                                         |
| Web (Vite dev)    | 5173; `/api/*` ని `127.0.0.1:3000` కి proxy చేస్తుంది             |
| Postgres (Docker) | host 5433 → container 5432 (machine లో వేరే Postgres ఉన్నా ఢీకొనదు) |

Env variables `.env.example` లో ఉన్నాయి. API వాటిని `apps/api/src/config.ts` లో Zod తో చదువుతుంది; విలువ తప్పైతే app start కాకముందే ఆగిపోతుంది. `.env` git లోకి వెళ్ళదు.

Browser ఎప్పుడూ తన origin కే (`/api/...`) request పంపుతుంది, కాబట్టి CORS అవసరం లేదు. Production లో కూడా web, API ఒకే origin లో ఉండాలి; F4 లో session cookie కి ఇది అవసరం.

## 5. Folder layout

```
stockmiles/
  package.json  pnpm-workspace.yaml  pnpm-lock.yaml  .nvmrc
  tsconfig.base.json  biome.json  vitest.config.ts
  docker-compose.yml  docker/postgres/init.sql   # local DB మాత్రమే
  Dockerfile  .dockerignore  render.yaml          # deploy image + Render Blueprint
  .env.example
  docs/infra.md  docs/roadmap.md  docs/domain/   # stack; modules; tenant model, access
  apps/
    api/            # @stockmiles/api — Fastify
      src/
        config.ts   # env → Zod
        app.ts      # buildApp(): routes; tests దీన్నే వాడతాయి
        server.ts   # listen + graceful shutdown (SIGTERM)
        web.ts      # WEB_DIST_DIR ఉంటే web build ని serve చేస్తుంది + SPA fallback
        db/
          client.ts   # createPool(): database కి ఏకైక దారి
          migrate.ts  # runMigrations() + local-only guard (pnpm db:migrate)
          schema/     # ఒక table కి ఒక file (users.ts ...)
        test/global-setup.ts  # tests ముందు test DB migrate
        *.test.ts   # tests file పక్కనే
      drizzle/      # generated .sql migrations + meta/ (చేతితో మార్చకూడదు; commit చేయాలి)
      drizzle.config.ts
    web/            # @stockmiles/web — Vite + React
      index.html  vite.config.ts  pwa-assets.config.ts
      public/       # logo-mark.svg + తయారైన icons (favicon, pwa-*.png, apple-touch-icon)
      src/
        main.tsx  index.css
        app/router.tsx  app/RootLayout.tsx
        features/<feature>/pages/  (తర్వాత components/, <feature>.store.ts)
        shared/components/AppStatusBar.tsx   # offline, "new version" banners
        shared/hooks/useOnlineStatus.ts
  packages/
    shared/         # @stockmiles/shared — Zod schemas (web + api)
      src/index.ts  src/schemas/
```

## 6. PWA, offline

**ఇప్పుడు ఉన్నది (ఒక్కసారి setup):**

- `manifest.webmanifest`: phone లో install అవుతుంది (Android "Install app", iPhone "Add to Home Screen"), standalone గా తెరుచుకుంటుంది.
- Service worker (Workbox `generateSW`): HTML, JS, CSS, icons ని cache చేస్తుంది. Server లేకపోయినా app తెరుచుకుంటుంది; ఏ path అయినా `index.html` కే వెళ్తుంది (`/api/*` తప్ప).
- `/api/*` responses ని service worker cache చేయదు. Offline data ఒక విడి, ఆలోచించి చేసే design.
- `registerType: 'prompt'`: కొత్త version వచ్చినా page దానంతటదే reload కాదు; పైన "A new version is ready — Reload" banner. Bill మధ్యలో page మారకూడదు.
- `AppStatusBar`: offline అయితే పైన పసుపు banner ("Changes cannot be saved").
- Dev (`pnpm dev`) లో service worker ఉండదు. PWA ని `build` + `preview` తో, లేదా deploy అయిన site లో మాత్రమే test చేయాలి.

**ప్రతి feature లో offline check (నియమం):** ప్రతి task card లో "Offline" line ఉంటుంది: network లేనప్పుడు ఈ feature ఏమి చేస్తుంది (పని చేస్తుంది / cache నుండి చదవటం మాత్రమే / స్పష్టమైన సందేశంతో ఆగుతుంది), UI ఆ స్థితిని ఎలా చూపిస్తుంది.

**ఇప్పటి నుండే పాటించే నియమాలు (offline sync కోసం):**

1. Bills లాంటి records కి id browser లోనే తయారవుతుంది (UUIDv7).
2. Create APIs ఒకే id తో రెండుసార్లు వచ్చినా ఒకే record సృష్టిస్తాయి (idempotent).

**తర్వాత:** Offline billing (IndexedDB queue + sync) Phase 2 లో, online billing పూర్తయ్యాక, pilot కి ముందు.

## 7. Deploy

**Region నిర్ణయం (2026-11-21):** మొదటి ఎంపిక India (Mumbai). Supabase కి Mumbai ఉంది, కానీ Render కి India region లేదు. App, database ఒకే region లో ఉండాలి (లేకపోతే ప్రతి query కి అదనపు network delay), కాబట్టి రెండూ **Singapore**. Launch ముందు (DPDP, data India లో ఉండాలా అనేది) మళ్ళీ పరిశీలిస్తాం; Docker image, plain Postgres వల్ల provider మార్చటం సులభం.

**ఆకారం:** ఒకే Docker image. Fastify `/api/*` తో పాటు web build (`apps/web/dist`) ని కూడా serve చేస్తుంది, కాబట్టి web, API ఒకే origin లో ఉంటాయి.

| విషయం          | విలువ                                                                                                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live URL      | https://stockmiles.onrender.com (మొదటి deploy: 2026-11-21)                                                                                                                                                                                                                                                          |
| Platform      | Render Web Service, `runtime: docker` (`render.yaml` Blueprint)                                                                                                                                                                                                                                                   |
| Render IDs    | Workspace "My Workspace" `tea-dc0vu5hksfps73fcg380`; Blueprint `exs-dc10mt8u01pc738cspvg`; service `stockmiles` (`srv-dc10m96tlv9c73am6n1g`)                                                                                                                                                                      |
| Region / plan | Singapore (Render కి India region లేదు) / Free (idle అయితే నిద్రపోతుంది; demo ముందు ఒకసారి తెరవాలి)                                                                                                                                                                                                                            |
| Deploy        | GitHub `main` కి push చేయగానే auto-deploy. దీనికి `stockmilesapp-ai` account లో **Render GitHub App install** అయి ఉండాలి (Settings → Applications → Installed GitHub Apps); login కోసం ఇచ్చే "Authorized" access సరిపోదు. Push Veera మాత్రమే చేస్తారు.                                                                                  |
| Health check  | `/api/health/live` (database ని తాకదు). `/api/health` పూర్తి స్థితి (DB తో సహా) page కోసం. DB సమస్య వచ్చినా Render app ని restart చేయదు, DB ని login ప్రయత్నాలతో కొట్టదు.                                                                                                                                                                |
| Port          | Render `PORT` env ఇస్తుంది; `config.ts` దాన్నే చదువుతుంది                                                                                                                                                                                                                                                               |
| Database      | Supabase Postgres, project `stockmiles` (ref `tbpavlhncgnsoyfnmmlj`), org `stockmiles`, region `ap-southeast-1` (Singapore), free plan. Plain Postgres మాత్రమే (Supabase libraries, auth వాడము). Render కి Session pooler (IPv4) connection string, `DATABASE_URL` secret గా. Hosted database మీద migrations Veera మాత్రమే. |

**Image లోపల:** Stage 1 web ని build చేస్తుంది. Stage 2 లో API production dependencies, `src/` files, `dist/` మాత్రమే ఉంటాయి; `node` user గా `node apps/api/src/server.ts` నడుస్తుంది. Tests, docs image లోకి వెళ్ళవు.

**Cache headers (web.ts):** `assets/*` (పేరులో hash ఉంటుంది) 1 సంవత్సరం `immutable`. `index.html`, `sw.js`, `manifest` `no-cache`; లేకపోతే phones పాత version నే చూపిస్తాయి. తెలియని page path → `index.html` (React Router చూసుకుంటుంది). `/api/*` లేదా extension ఉన్న తెలియని path → JSON 404.

**Local గా image test:**

```bash
docker build -t stockmiles:local .
docker run --rm -p 8080:10000 -e PORT=10000 stockmiles:local   # http://localhost:8080
```

**Vercel ఎందుకు కాదు:** మన API long-running Fastify server; Vercel లో serverless functions గా మార్చాలి.
