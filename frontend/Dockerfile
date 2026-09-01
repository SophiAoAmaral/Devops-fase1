# Estagio 1: gera os arquivos estaticos com o Vite.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# A URL da API entra no bundle em tempo de build porque o Vite substitui
# import.meta.env durante a compilacao. Vazio = mesma origem, que e o caso
# aqui porque o nginx desta imagem encaminha /api para o container da API.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Estagio 2: serve o build com nginx. A imagem final nao carrega Node nem
# codigo-fonte, so os arquivos estaticos.
FROM nginx:1.27-alpine AS producao

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fs http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
