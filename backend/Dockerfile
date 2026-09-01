# Estagio 1: instala apenas as dependencias de producao.
FROM node:22-alpine AS dependencias

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Estagio 2: imagem final, sem npm cache e sem devDependencies.
FROM node:22-alpine AS producao

# curl e usado pelo HEALTHCHECK e pelo smoke test do deploy.
RUN apk add --no-cache curl

WORKDIR /app

COPY --from=dependencias /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production
ENV PORT=3000

# A imagem node ja traz o usuario 'node' sem privilegios: rodar como root
# dentro do container e um risco desnecessario.
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fs http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
