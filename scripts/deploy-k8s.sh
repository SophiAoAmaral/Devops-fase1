#!/usr/bin/env bash
set -Eeuo pipefail

TAG="${1:-latest}"
NAMESPACE="${NAMESPACE:-pethub}"
REGISTRY="${REGISTRY:-ghcr.io/sophiaoamaral}"
ESPERA="${ESPERA:-180s}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '\n\033[1;34m[k8s]\033[0m %s\n' "$*"; }
erro() { printf '\n\033[1;31m[k8s] ERRO:\033[0m %s\n' "$*" >&2; }

command -v kubectl >/dev/null || { erro "kubectl nao encontrado no PATH."; exit 3; }

log "aplicando os manifests em $RAIZ/k8s"
kubectl apply -f "$RAIZ/k8s/"

log "apontando os deployments para a tag $TAG"
kubectl -n "$NAMESPACE" set image deployment/pethub-backend \
  "api=${REGISTRY}/pethub-api:${TAG}" --record=false
kubectl -n "$NAMESPACE" set image deployment/pethub-frontend \
  "web=${REGISTRY}/pethub-web:${TAG}" --record=false

for deployment in pethub-backend pethub-frontend; do
  log "aguardando o rollout de $deployment"
  if ! kubectl -n "$NAMESPACE" rollout status "deployment/$deployment" --timeout="$ESPERA"; then
    erro "$deployment nao subiu; voltando para a revisao anterior"
    kubectl -n "$NAMESPACE" rollout undo "deployment/$deployment"
    kubectl -n "$NAMESPACE" rollout status "deployment/$deployment" --timeout="$ESPERA"
    exit 1
  fi
done

log "estado final"
kubectl -n "$NAMESPACE" get deployments,pods,svc,hpa
