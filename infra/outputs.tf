output "vpc_id" {
  description = "Identificador da VPC criada."
  value       = aws_vpc.principal.id
}

output "subnet_id" {
  description = "Identificador da sub-rede publica."
  value       = aws_subnet.publica.id
}

output "security_group_id" {
  description = "Identificador do security group da API."
  value       = aws_security_group.api.id
}

output "ecr_url" {
  description = "Endereco do repositorio de imagens, usado na Fase 2."
  value       = aws_ecr_repository.api.repository_url
}

output "bucket_frontend" {
  description = "Nome do bucket que hospedara o frontend."
  value       = aws_s3_bucket.frontend.id
}
