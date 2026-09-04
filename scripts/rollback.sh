#!/usr/bin/env bash
set -Eeuo pipefail

AMBIENTE="${1:-local}"
TAG_ALVO="${2:-}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARQUIVO="$RAIZ/.deploy/versao-anterior-${AMBIENTE}.txt"

cd "$RAIZ"

log() { printf '\n\033[1;33m[rollback:%s]\033[0m %s\n' "$AMBIENTE" "$*"; }
erro() { printf '\n\033[1;31m[rollback:%s] ERRO:\033[0m %s\n' "$AMBIENTE" "$*" >&2; }

COMPOSE=(docker compose)
docker compose version >/dev/null 2>&1 || COMPOSE=(docker-compose)

if [ -n "$TAG_ALVO" ]; then
  export TAG="$TAG_ALVO"
elif [ -s "$ARQUIVO" ]; then
  imagem=$(cat "$ARQUIVO")
  export TAG="${imagem##*:}"
  export REGISTRY="${imagem%/*}"
else
  erro "nao ha versao anterior registrada em $ARQUIVO e nenhuma tag foi informada."
  erro "suba uma versao conhecida com: TAG=<tag> ./scripts/deploy.sh $AMBIENTE"
  exit 1
fi

log "restaurando a tag $TAG"
"${COMPOSE[@]}" pull backend frontend 2>/dev/null || log "usando as imagens ja presentes no host"
"${COMPOSE[@]}" up -d --remove-orphans

if "$RAIZ/scripts/smoke-test.sh" "http://localhost:${PORTA_API:-3000}"; then
  log "rollback concluido: a versao $TAG esta no ar e saudavel"
else
  erro "a versao $TAG tambem falhou no smoke test; e preciso intervencao manual"
  exit 1
fi
