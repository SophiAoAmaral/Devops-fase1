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
