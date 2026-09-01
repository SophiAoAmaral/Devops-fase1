# PetHub — DevOps na Prática

Aplicação de gestão de petshop usada como projeto da disciplina. O repositório
reúne o código, a esteira de automação, a infraestrutura como código e o
monitoramento.

| Fase | Entrega |
|---|---|
| Fase 1 | Aplicação, testes automatizados, pipeline de CI e infraestrutura como código |
| Fase 2 | Entrega contínua, containers e orquestração, monitoramento e segurança |

## Estrutura

```
backend/      API REST em Node.js e Express, com métricas Prometheus
frontend/     Interface em React e Vite, servida por nginx em produção
infra/        Terraform: rede, ECR, S3, logs, alarmes e painel
k8s/          Manifests do Kubernetes: Deployments, Services, Ingress, HPA
monitoring/   Configuração do Prometheus, alertas e painel do Grafana
scripts/      deploy, rollback, smoke test e deploy no Kubernetes
docs/         Relatório das fases e diagramas
.github/      Pipelines de CI, CD e segurança
```

## Subir tudo em um comando

```bash
./scripts/deploy.sh local
```

O script constrói as imagens, sobe a stack e só devolve sucesso depois que o
smoke test passa. Se o smoke test reprovar, ele mesmo chama o rollback.

| Serviço | Endereço |
|---|---|
| Aplicação | http://localhost:8080 |
| API | http://localhost:3000/api/pets |
| Métricas | http://localhost:3000/metrics |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin / admin) |

Para derrubar: `docker compose down -v`.

## Desenvolvimento sem containers

```bash
cd backend  && npm ci && npm run dev     # API na porta 3000
cd frontend && npm ci && npm run dev     # interface na 5173, com proxy para /api
```

## Verificações locais

```bash
cd backend  && npm run lint && npm test
cd frontend && npm run lint && npm test && npm run build
cd infra    && terraform fmt -check && terraform init -backend=false && terraform validate
./scripts/smoke-test.sh http://localhost:3000
```

## Kubernetes

```bash
kind create cluster --name pethub --config k8s/kind-cluster.yaml
./scripts/deploy-k8s.sh latest
```

## Pipelines

| Workflow | Quando roda | O que faz |
|---|---|---|
| `ci.yml` | push e pull request no `main` | lint, testes, build, Terraform, integração em containers e validação dos manifests |
| `cd.yml` | após o CI passar no `main` | publica as imagens, varre com Trivy, implanta em staging e, com aprovação manual, em produção |
| `seguranca.yml` | push, pull request e toda segunda | `npm audit`, CodeQL, Gitleaks, Hadolint e Trivy |

O relatório completo das duas fases está em
[`docs/RELATORIO-FASE2.md`](docs/RELATORIO-FASE2.md).
