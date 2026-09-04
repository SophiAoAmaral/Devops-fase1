#!/usr/bin/env bash
set -Eeuo pipefail

AMBIENTE="${1:-local}"
TAG="${TAG:-local}"
REGISTRY="${REGISTRY:-pethub}"
PORTA_API="${PORTA_API:-3000}"
PORTA_WEB="${PORTA_WEB:-8080}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$RAIZ"

log() { printf '\n\033[1;34m[deploy:%s]\033[0m %s\n' "$AMBIENTE" "$*"; }
erro() { printf '\n\033[1;31m[deploy:%s] ERRO:\033[0m %s\n' "$AMBIENTE" "$*" >&2; }

case "$AMBIENTE" in
  local|staging|producao) ;;
  *) erro "ambiente invalido: '$AMBIENTE' (use local, staging ou producao)"; exit 2 ;;
esac

command -v docker >/dev/null || { erro "docker nao encontrado no PATH."; exit 3; }

COMPOSE=(docker compose)
docker compose version >/dev/null 2>&1 || COMPOSE=(docker-compose)

export TAG REGISTRY PORTA_API PORTA_WEB
export APP_VERSION="${APP_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo "$TAG")}"

mkdir -p .deploy
docker inspect --format '{{.Config.Image}}' pethub-backend 2>/dev/null \
  > ".deploy/versao-anterior-${AMBIENTE}.txt" || true

log "versao $APP_VERSION, tag de imagem $TAG"

if [ "$AMBIENTE" = "local" ]; then
  log "construindo as imagens a partir do codigo local"
  "${COMPOSE[@]}" build
else
  log "baixando as imagens do registro $REGISTRY"
  "${COMPOSE[@]}" pull backend frontend
fi

log "subindo os containers"
"${COMPOSE[@]}" up -d --remove-orphans

log "aguardando a API ficar pronta"
if ! "$RAIZ/scripts/smoke-test.sh" "http://localhost:${PORTA_API}"; then
  erro "o smoke test falhou; iniciando rollback automatico"
  "$RAIZ/scripts/rollback.sh" "$AMBIENTE"
  exit 1
fi

log "deploy concluido com sucesso"
printf '  Aplicacao ...: http://localhost:%s\n' "$PORTA_WEB"
printf '  API .........: http://localhost:%s/api/pets\n' "$PORTA_API"
printf '  Metricas ....: http://localhost:%s/metrics\n' "$PORTA_API"
printf '  Prometheus ..: http://localhost:%s\n' "${PORTA_PROMETHEUS:-9090}"
printf '  Grafana .....: http://localhost:%s\n' "${PORTA_GRAFANA:-3001}"
