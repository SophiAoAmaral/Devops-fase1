const client = require('prom-client');

const registro = new client.Registry();

registro.setDefaultLabels({
  aplicacao: 'pethub-api',
  ambiente: process.env.NODE_ENV || 'development',
  versao: process.env.APP_VERSION || 'dev'
});

client.collectDefaultMetrics({ register: registro });

const requisicoesTotal = new client.Counter({
  name: 'pethub_http_requisicoes_total',
  help: 'Total de requisicoes HTTP recebidas pela API.',
  labelNames: ['metodo', 'rota', 'status'],
  registers: [registro]
});

const duracaoRequisicao = new client.Histogram({
  name: 'pethub_http_duracao_segundos',
  help: 'Duracao das requisicoes HTTP em segundos.',
  labelNames: ['metodo', 'rota', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 3],
  registers: [registro]
});

const petsCadastrados = new client.Gauge({
  name: 'pethub_pets_cadastrados',
  help: 'Quantidade de pets atualmente cadastrados.',
  registers: [registro]
});

function medir(req, res, proximo) {
  const fim = duracaoRequisicao.startTimer();

  res.on('finish', () => {
    const rota = req.route ? `${req.baseUrl}${req.route.path}` : 'desconhecida';
    const rotulos = { metodo: req.method, rota, status: res.statusCode };

    fim(rotulos);
    requisicoesTotal.inc(rotulos);
  });

  proximo();
}

module.exports = { registro, medir, petsCadastrados };
