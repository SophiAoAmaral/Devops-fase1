terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

provider "aws" {
  region = var.regiao

  default_tags {
    tags = {
      Projeto    = var.projeto
      Ambiente   = var.ambiente
      Disciplina = "DevOps-PUCRS"
    }
  }
}
