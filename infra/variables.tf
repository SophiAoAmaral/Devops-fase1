variable "regiao" {
  description = "Regiao da AWS onde os recursos serao criados."
  type        = string
  default     = "us-east-1"
}

variable "projeto" {
  description = "Nome do projeto, usado como prefixo dos recursos."
  type        = string
  default     = "pethub"
}

variable "ambiente" {
  description = "Ambiente de implantacao."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prd"], var.ambiente)
    error_message = "O ambiente deve ser dev ou prd."
  }
}

variable "cidr_vpc" {
  description = "Faixa de enderecos IP da VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "cidr_subnet" {
  description = "Faixa de enderecos IP da sub-rede publica."
  type        = string
  default     = "10.0.1.0/24"
}

variable "porta_api" {
  description = "Porta em que a API responde."
  type        = number
  default     = 3000
}

variable "retencao_logs" {
  description = "Dias de retencao dos logs da aplicacao no CloudWatch."
  type        = number
  default     = 14

  validation {
    condition     = var.retencao_logs >= 1
    error_message = "A retencao deve ser de ao menos 1 dia."
  }
}

variable "email_alertas" {
  description = "E-mail que recebe os alarmes. Vazio desliga a inscricao."
  type        = string
  default     = ""
}

variable "tag_imagem" {
  description = "Tag da imagem publicada no ECR que o ambiente deve executar."
  type        = string
  default     = "latest"
}
