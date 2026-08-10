resource "aws_ecr_repository" "api" {
  name         = "${var.projeto}-api"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.projeto}-ecr" }
}

resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.projeto}-frontend-${var.ambiente}"
  force_destroy = true

  tags = { Name = "${var.projeto}-frontend" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
