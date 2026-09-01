# Relatório do projeto — PetHub

Projeto da disciplina **DevOps na Prática**. O PetHub é uma API de cadastro de
pets com interface web. O que importa aqui não é a aplicação, e sim a esteira
que leva um commit até produção com testes, segurança e monitoramento.

---

## Fase 1 — Fundação

### O que foi entregue

**Aplicação.** API REST em Node.js e Express com quatro rotas de negócio
(`GET /api/pets`, `GET /api/pets/:id`, `POST /api/pets`, `DELETE /api/pets/:id`)
e uma de verificação (`GET /health`). A validação de entrada é isolada em
`backend/src/pets.js`, o que permite testá-la sem subir servidor. A interface é
uma página React que consome essa API.

**Testes automatizados.** Jest e Supertest no backend, Vitest e Testing Library
no frontend. Os testes cobrem os caminhos felizes e os de erro: pet inexistente
devolve 404, corpo inválido devolve 400 com a lista de problemas, espécie fora
da lista é recusada.

**Pipeline de CI.** `.github/workflows/ci.yml` roda a cada push e pull request
no `main`, em três jobs paralelos — backend, frontend e infraestrutura. Cada um
executa lint, testes e build. O build do frontend é publicado como artefato.

**Infraestrutura como código.** Terraform em `infra/` descrevendo VPC, sub-rede
pública, internet gateway, tabela de rotas, security group, repositório ECR
para as imagens e bucket S3 para o frontend. O bucket já nasce com acesso
público bloqueado e criptografia AES256.

### Decisões da Fase 1

- **Jobs paralelos em vez de sequenciais.** Um erro de lint no frontend não
  precisa esperar os testes do backend para aparecer.
- **`terraform init -backend=false` no CI.** Valida a configuração sem
  credenciais da AWS e sem tocar em estado remoto.
- **Estado em memória no backend.** A disciplina é sobre a esteira; banco de
  dados adicionaria complexidade sem acrescentar nada ao aprendizado.

### O que ficou em aberto

O CI provava que o código estava correto, mas parava aí. Não havia entrega
automatizada, a aplicação não rodava em containers, não existia visibilidade
sobre o comportamento em execução e a segurança dependia de revisão manual.
São exatamente esses quatro pontos que a Fase 2 resolve.

---

## Fase 2 — Entrega contínua, containers, monitoramento e segurança

### 1. Pipeline de entrega contínua

O CI da Fase 1 foi mantido e ganhou dois jobs novos:

- **`integracao`** sobe a stack inteira em containers, confirma que o
  front-end responde, que o proxy `/api` chega até a API, que o Prometheus
  está coletando métricas e que o container **não roda como root**.
- **`manifestos`** valida os manifests do Kubernetes contra o esquema oficial
  com o `kubeconform`.

Acima dele entrou o `cd.yml`, disparado por `workflow_run` — ou seja, **só
começa depois que o CI termina verde no `main`**. Nenhuma imagem é publicada a
partir de código que não passou nos testes.

O fluxo do CD tem quatro etapas encadeadas:

| Etapa | O que faz | Portão |
|---|---|---|
| `build` | Constrói as duas imagens e publica no GHCR com a tag do commit e `latest` | — |
| `varredura` | Trivy nas imagens publicadas | Falha em CRITICAL ou HIGH corrigível |
| `staging` | `./scripts/deploy.sh staging` | Smoke test precisa passar |
| `producao` | `./scripts/deploy.sh producao` | **Aprovação humana** via GitHub Environment |

O portão de produção usa o recurso de *Environments* do GitHub: a etapa fica
parada até que alguém com permissão aprove. É a diferença entre entrega
contínua e implantação contínua — a decisão de publicar continua sendo humana,
mas tudo que vem antes dela é automático e repetível.

**Rollback.** O `deploy.sh` grava a imagem que estava no ar antes de mexer em
qualquer coisa. Se o smoke test reprovar, ele chama o `rollback.sh` sozinho e
volta para a versão anterior. No Kubernetes, o `deploy-k8s.sh` faz o mesmo com
`kubectl rollout undo` quando o rollout não conclui no prazo.

**Zero downtime.** Três peças agindo juntas:

1. `GET /ready` separado do `GET /health`. O `/health` diz se o processo está
   vivo; o `/ready` diz se ele aceita tráfego.
2. Encerramento gracioso no `server.js`: ao receber `SIGTERM`, o `/ready` passa
   a responder 503, o orquestrador tira o container do balanceador e só então
   as conexões abertas terminam.
3. `maxUnavailable: 0` nos Deployments: o pod antigo só cai depois que o novo
   passa no readiness.

### 2. Containers e orquestração

**Imagens.** Os dois Dockerfiles são multi-stage. A da API separa a instalação
de dependências da imagem final, que sai sem cache do npm e sem
`devDependencies`. A do front-end compila com o Vite e entrega apenas os
arquivos estáticos para o nginx — a imagem final não carrega Node nem
código-fonte.

Endurecimento aplicado nas duas: usuário sem privilégios (`USER node`),
`HEALTHCHECK` declarado, `.dockerignore` impedindo que `.env`, `.git` e
`node_modules` entrem no contexto de build.

**Composição.** O `docker-compose.yml` sobe quatro serviços em uma rede
dedicada: backend, frontend, Prometheus e Grafana. O frontend só sobe depois
que a API responde `/ready` (`depends_on: condition: service_healthy`),
evitando a tela de erro no primeiro carregamento. O nginx encaminha `/api` para
o backend, então o navegador fala com uma única origem e o CORS não precisa
ficar aberto em produção.

**Orquestração.** Os manifests em `k8s/` levam a mesma stack para um cluster:

- Deployments com 2 réplicas, rolling update sem indisponibilidade, probes de
  liveness e readiness, requests e limits de CPU e memória;
- `securityContext` com `runAsNonRoot`, `readOnlyRootFilesystem` e todas as
  capabilities removidas;
- Services ClusterIP e um Ingress roteando `/api` para a API e o restante para
  o front-end;
- HPA escalando de 2 a 6 réplicas a 70% de CPU;
- NetworkPolicy: o backend só aceita conexão do front-end, do ingress e do
  namespace de monitoramento — nenhum outro pod do cluster alcança a porta 3000.

O `k8s/kind-cluster.yaml` permite reproduzir tudo localmente, sem nuvem.

### 3. Monitoramento

A API expõe `GET /metrics` no formato do Prometheus, com as métricas padrão do
processo Node e três métricas próprias:

| Métrica | Tipo | Para quê |
|---|---|---|
| `pethub_http_requisicoes_total` | Counter | Volume e taxa de erro por rota e status |
| `pethub_http_duracao_segundos` | Histogram | Latência p50, p95 e p99 |
| `pethub_pets_cadastrados` | Gauge | Métrica de negócio |

Um detalhe que evita um problema comum: o rótulo de rota usa o padrão declarado
no Express (`/api/pets/:id`) e não a URL concreta. Se usasse a URL, cada id
viraria uma série temporal diferente e o Prometheus explodiria em cardinalidade.
Há um teste garantindo isso.

O Grafana sobe com fonte de dados e painel já provisionados por arquivo — não
há configuração manual. O painel mostra disponibilidade, pets cadastrados, taxa
de erro, tempo no ar, requisições por rota, latência em três percentis, status
HTTP e consumo de memória.

Quatro alertas em `monitoring/alertas.yml`: API fora do ar, taxa de erro acima
de 5%, p95 acima de 500ms e memória acima de 300MB. No Terraform, os mesmos
limiares viram alarmes do CloudWatch publicando em um tópico SNS.

### 4. Segurança

Segurança entrou como etapa do pipeline, não como revisão manual. O
`seguranca.yml` roda em cinco frentes:

| Frente | Ferramenta | O que pega |
|---|---|---|
| Dependências | `npm audit --audit-level=high` | Pacotes com CVE conhecida |
| Código | CodeQL | Injeção, dados não sanitizados, padrões inseguros |
| Segredos | Gitleaks | Chave ou token commitado, inclusive no histórico |
| Containers | Hadolint + Trivy | Dockerfile fora das boas práticas, CVE no sistema base |
| Infraestrutura | Trivy config | Terraform e manifests com configuração insegura |

Roda em cada push e pull request e também toda segunda-feira — vulnerabilidade
divulgada depois do merge não fica invisível.

Na aplicação: `helmet` para os cabeçalhos de segurança, `x-powered-by`
desligado, corpo do JSON limitado a 10kb, CORS configurável por ambiente em vez
de aberto por padrão, e cabeçalhos de segurança também no nginx.

---

## Resultados

| Antes (Fase 1) | Depois (Fase 2) |
|---|---|
| CI valida o código e para | Esteira vai do commit ao ambiente aprovado |
| Deploy manual | Um comando, com smoke test e rollback automático |
| Aplicação roda direto no host | Containers com usuário sem privilégios e limites |
| Sem visibilidade em execução | Métricas, painel e quatro alertas |
| Segurança por revisão manual | Cinco varreduras automatizadas no pipeline |
| Sem estratégia de rollback | Rollback automático no compose e no Kubernetes |

**Ganhos concretos.** O tempo entre aprovar um pull request e ter a versão em
staging validada deixou de depender de alguém estar disponível. A falha de um
deploy passou a ser detectada pelo smoke test em segundos, e não por um usuário
reclamando. Uma vulnerabilidade crítica em dependência trava a promoção da
imagem antes de ela chegar a qualquer ambiente.

## Melhorias futuras

1. **Banco de dados com migrações versionadas.** O estado em memória some a cada
   reinício. Um PostgreSQL com migrações no pipeline traria o desafio real de
   evoluir esquema sem downtime.
2. **Deploy canário.** Hoje o rolling update troca todas as réplicas. Um canário
   com 10% do tráfego, promovido só se a taxa de erro se mantiver, reduziria o
   raio de impacto de uma versão ruim.
3. **Rastreamento distribuído.** As métricas dizem *que* algo está lento;
   OpenTelemetry com Jaeger diria *onde*.
4. **Gestão de segredos.** As variáveis hoje vêm de ConfigMap e secrets do
   GitHub. Vault ou AWS Secrets Manager com rotação automática seria o passo
   seguinte.
5. **GitOps com ArgoCD.** O cluster passaria a se reconciliar sozinho a partir
   do repositório, eliminando o `kubectl apply` imperativo do pipeline.
6. **Testes de carga no pipeline.** k6 em staging, com limiares de latência que
   reprovam a promoção, fecharia a lacuna entre "os testes passam" e "aguenta
   produção".
