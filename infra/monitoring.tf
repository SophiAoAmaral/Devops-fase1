resource "aws_cloudwatch_log_group" "api" {
  name              = "/pethub/${var.ambiente}/api"
  retention_in_days = var.retencao_logs

  tags = { Name = "${var.projeto}-logs-api" }
}

resource "aws_sns_topic" "alertas" {
  name = "${var.projeto}-alertas-${var.ambiente}"

  tags = { Name = "${var.projeto}-alertas" }
}

resource "aws_sns_topic_subscription" "alertas_email" {
  count = var.email_alertas == "" ? 0 : 1

  topic_arn = aws_sns_topic.alertas.arn
  protocol  = "email"
  endpoint  = var.email_alertas
}

resource "aws_cloudwatch_metric_alarm" "erros_5xx" {
  alarm_name          = "${var.projeto}-${var.ambiente}-erros-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  period              = 300
  threshold           = 5
  statistic           = "Sum"
  namespace           = "PetHub/API"
  metric_name         = "RespostasErro5xx"
  treat_missing_data  = "notBreaching"

  alarm_description = "Mais de 5 respostas 5xx em duas janelas de 5 minutos."
  alarm_actions     = [aws_sns_topic.alertas.arn]
  ok_actions        = [aws_sns_topic.alertas.arn]

  tags = { Name = "${var.projeto}-alarme-5xx" }
}

resource "aws_cloudwatch_metric_alarm" "latencia" {
  alarm_name          = "${var.projeto}-${var.ambiente}-latencia-alta"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  period              = 300
  extended_statistic  = "p95"
  namespace           = "PetHub/API"
  metric_name         = "TempoDeResposta"
  threshold           = 0.5
  treat_missing_data  = "notBreaching"

  alarm_description = "O percentil 95 de latencia passou de 500ms."
  alarm_actions     = [aws_sns_topic.alertas.arn]

  tags = { Name = "${var.projeto}-alarme-latencia" }
}

resource "aws_cloudwatch_dashboard" "pethub" {
  dashboard_name = "${var.projeto}-${var.ambiente}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title  = "Requisicoes por status"
          region = var.regiao
          view   = "timeSeries"
          metrics = [
            ["PetHub/API", "RespostasSucesso2xx"],
            ["PetHub/API", "RespostasErro4xx"],
            ["PetHub/API", "RespostasErro5xx"]
          ]
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title  = "Latencia p95"
          region = var.regiao
          view   = "timeSeries"
          metrics = [
            ["PetHub/API", "TempoDeResposta", { stat = "p95" }]
          ]
        }
      }
    ]
  })
}
