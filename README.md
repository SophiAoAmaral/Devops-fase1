# PetHub — Fase 1: Configuração e Automação Inicial

Projeto da disciplina de **DevOps** (PUCRS Online). Esta fase entrega o pipeline de Integração Contínua e os scripts de Infraestrutura como Código de uma aplicação de gestão de petshop.

> Documento de planejamento: `docs/Fase1-Documentacao-Planejamento.docx`

## Tecnologias

| Parte | Tecnologia |
|---|---|
| API | Node.js 22 + Express |
| Interface | React 18 + Vite |
| Testes | Jest e Supertest (API) · Vitest e Testing Library (interface) |
| Infraestrutura | Terraform (AWS) |
| Automação | GitHub Actions |

## Estrutura

```
.
├── .github/workflows/ci.yml   Pipeline de Integração Contínua
├── backend/                   API REST
│   ├── src/
│   │   ├── app.js             Rotas e configuração do Express
│   │   ├── pets.js            Dados e validação
│   │   └── server.js          Inicialização do servidor
│   ├── tests/                 9 testes automatizados
│   └── Dockerfile
├── frontend/                  Interface web
│   └── src/
│       ├── App.jsx            Tela de cadastro e listagem
│       ├── api.js             Chamadas à API
│       └── App.test.jsx       4 testes automatizados
├── infra/                     5 arquivos Terraform
└── docs/                      Documentação
```

## Executando localmente

Precisa do Node.js 22 ou superior.

**API** (porta 3000):

```bash
cd backend
npm install
npm run dev
```

**Interface** (porta 5173), em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

**Verificações:**

```bash
npm run lint    # estilo do código
npm test        # testes automatizados
```

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica se a aplicação responde |
| `GET` | `/api/pets` | Lista os pets |
| `GET` | `/api/pets/:id` | Consulta um pet |
| `POST` | `/api/pets` | Cadastra um pet |
| `DELETE` | `/api/pets/:id` | Remove um pet |

Exemplo:

```bash
curl -X POST http://localhost:3000/api/pets \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Bidu","especie":"cao","idade":4,"tutor":"Marina"}'
```

Campos obrigatórios: `nome` (mínimo 2 caracteres), `especie` (`cao`, `gato`, `ave` ou `roedor`), `idade` (inteiro) e `tutor` (mínimo 3 caracteres).

## Pipeline de Integração Contínua

Roda automaticamente a cada envio de código para a branch `main` e a cada pull request. São três jobs, executados em paralelo:

| Job | O que verifica |
|---|---|
| **Back-end** | Estilo do código, os 9 testes e a construção da imagem Docker |
| **Front-end** | Estilo do código, os 4 testes e o build de produção |
| **Infraestrutura** | Formatação e validade dos arquivos Terraform |

Se qualquer verificação falhar, o job correspondente fica vermelho e o pull request fica marcado como reprovado.

## Infraestrutura como Código

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform plan
```

Recursos provisionados:

| Arquivo | Conteúdo |
|---|---|
| `versions.tf` | Versão do Terraform, provider AWS e tags padrão |
| `variables.tf` | Seis variáveis de entrada |
| `network.tf` | VPC, Internet Gateway, sub-rede, tabela de rotas e security group |
| `storage.tf` | Repositório de imagens (ECR) e bucket do frontend (S3) |
| `outputs.tf` | Identificadores dos recursos criados |

**Atenção:** `terraform apply` cria recursos de verdade na sua conta AWS. Para esta fase, `terraform validate` e `terraform plan` já são suficientes — nenhum dos dois cria nada. Se aplicar, rode `terraform destroy` depois para não gerar cobrança.

## Próximos passos (Fase 2)

- Publicar a imagem da API no repositório ECR pelo pipeline
- Provisionar o serviço que vai executar o contêiner
- Enviar o build da interface para o bucket S3 e configurar a distribuição
- Substituir o armazenamento em memória por um banco de dados
