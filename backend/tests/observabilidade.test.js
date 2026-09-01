const request = require('supertest');
const app = require('../src/app');
const pets = require('../src/pets');

const petValido = { nome: 'Bidu', especie: 'cao', idade: 4, tutor: 'Marina' };

beforeEach(() => {
  pets.limpar();
  app.locals.encerrando = false;
});

test('GET /ready informa que a aplicacao aceita trafego', async () => {
  const resposta = await request(app).get('/ready');

  expect(resposta.status).toBe(200);
  expect(resposta.body.status).toBe('pronto');
});

test('GET /ready responde 503 durante o encerramento gracioso', async () => {
  app.locals.encerrando = true;

  const resposta = await request(app).get('/ready');

  expect(resposta.status).toBe(503);
});

test('GET /metrics expoe as metricas no formato do Prometheus', async () => {
  const resposta = await request(app).get('/metrics');

  expect(resposta.status).toBe(200);
  expect(resposta.text).toContain('pethub_http_requisicoes_total');
  expect(resposta.text).toContain('pethub_pets_cadastrados');
});

test('GET /metrics conta os pets cadastrados', async () => {
  await request(app).post('/api/pets').send(petValido);

  const resposta = await request(app).get('/metrics');

  expect(resposta.text).toMatch(/pethub_pets_cadastrados\{[^}]*\} 1/);
});

test('a rota nas metricas usa o padrao do Express e nao o id concreto', async () => {
  const criado = await request(app).post('/api/pets').send(petValido);
  await request(app).get(`/api/pets/${criado.body.dados.id}`);

  const resposta = await request(app).get('/metrics');

  expect(resposta.text).toContain('rota="/api/pets/:id"');
});

test('as respostas trazem os cabecalhos de seguranca do helmet', async () => {
  const resposta = await request(app).get('/health');

  expect(resposta.headers['x-content-type-options']).toBe('nosniff');
  expect(resposta.headers['x-powered-by']).toBeUndefined();
});
