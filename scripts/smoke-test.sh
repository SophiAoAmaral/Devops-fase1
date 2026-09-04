#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${1:-http://localhost:3000}"
TENTATIVAS="${TENTATIVAS:-30}"
INTERVALO="${INTERVALO:-2}"

falhou=0
verificar() {
  local descricao="$1" esperado="$2" obtido="$3"
  if [ "$obtido" = "$esperado" ]; then
    printf '  \033[32mok\033[0m   %s\n' "$descricao"
  else
    printf '  \033[31mfalha\033[0m %s (esperado %s, obtido %s)\n' "$descricao" "$esperado" "$obtido"
    falhou=1
  fi
}

codigo() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

printf 'Aguardando %s responder...\n' "$BASE"
for i in $(seq 1 "$TENTATIVAS"); do
  if [ "$(codigo "$BASE/ready")" = "200" ]; then
    printf 'Pronta apos %ss.\n' "$(( (i - 1) * INTERVALO ))"
    break
  fi
  if [ "$i" -eq "$TENTATIVAS" ]; then
    printf '\033[31mA aplicacao nao ficou pronta em %ss.\033[0m\n' "$(( TENTATIVAS * INTERVALO ))" >&2
    exit 1
  fi
  sleep "$INTERVALO"
done

printf '\nSmoke test:\n'
verificar "GET /health"        200 "$(codigo "$BASE/health")"
verificar "GET /ready"         200 "$(codigo "$BASE/ready")"
verificar "GET /metrics"       200 "$(codigo "$BASE/metrics")"
verificar "GET /api/pets"      200 "$(codigo "$BASE/api/pets")"
verificar "GET /api/pets/0000" 404 "$(codigo "$BASE/api/pets/0000")"
verificar "POST /api/pets invalido" 400 \
  "$(codigo -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/pets")"

criado=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"nome":"SmokeTest","especie":"cao","idade":1,"tutor":"Pipeline"}' \
  "$BASE/api/pets")
id=$(printf '%s' "$criado" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

if [ -n "$id" ]; then
  printf '  \033[32mok\033[0m   POST /api/pets criou o pet %s\n' "$id"
  verificar "DELETE /api/pets/$id" 204 "$(codigo -X DELETE "$BASE/api/pets/$id")"
else
  printf '  \033[31mfalha\033[0m POST /api/pets nao retornou um id\n'
  falhou=1
fi

if curl -s "$BASE/metrics" | grep -q 'pethub_http_requisicoes_total'; then
  printf '  \033[32mok\033[0m   as metricas registraram o trafego do teste\n'
else
  printf '  \033[31mfalha\033[0m /metrics nao expos pethub_http_requisicoes_total\n'
  falhou=1
fi

if [ "$falhou" -eq 0 ]; then
  printf '\n\033[1;32mSmoke test aprovado.\033[0m\n'
else
  printf '\n\033[1;31mSmoke test reprovado.\033[0m\n' >&2
fi
exit "$falhou"
