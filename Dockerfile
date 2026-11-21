# One image: Fastify serves /api/* and the built React app on the same origin.

# ---- Stage 1: build the web app ----
FROM node:24-slim AS build
RUN npm install -g pnpm@10.15.0
WORKDIR /app
# Package files first, so Docker reuses the install layer when only code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @stockmiles/web build

# ---- Stage 2: run the API ----
FROM node:24-slim
RUN npm install -g pnpm@10.15.0
ENV NODE_ENV=production
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# Production dependencies of the API and the packages it uses (shared) only.
RUN pnpm install --frozen-lockfile --prod --filter "@stockmiles/api..."
COPY apps/api/src apps/api/src
COPY packages/shared/src packages/shared/src
COPY --from=build /app/apps/web/dist apps/web/dist
ENV WEB_DIST_DIR=/app/apps/web/dist
USER node
EXPOSE 3000
# No build step: Node 24 runs the TypeScript files directly.
CMD ["node", "apps/api/src/server.ts"]
