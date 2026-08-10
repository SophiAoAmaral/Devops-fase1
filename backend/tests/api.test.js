const request = require('supertest');
const app = require('../src/app');
const pets = require('../src/pets');

const petValido = { nome: 'Bidu', especie: 'cao', idade: 4, tutor: 'Marina' };

beforeEach(() => {
  pets.limpar();
});

test('GET /health responde que a aplicacao esta ok', async () => {
  const resposta = await request(app).get('/health');

  expect(resposta.status).toBe(200);
  expect(resposta.body.status).toBe('ok');
});

test('GET /api/pets retorna lista vazia no inicio', async () => {
  const resposta = await request(app).get('/api/pets');

  expect(resposta.status).toBe(200);
  expect(resposta.body.total).toBe(0);
});

test('POST /api/pets cadastra um pet', async () => {
  const resposta = await request(app).post('/api/pets').send(petValido);

  expect(resposta.status).toBe(201);
  expect(resposta.body.dados.nome).toBe('Bidu');
  expect(resposta.body.dados.id).toBeDefined();
});

test('POST /api/pets recusa dados invalidos', async () => {
  const resposta = await request(app).post('/api/pets').send({});

  expect(resposta.status).toBe(400);
  expect(resposta.body.detalhes.length).toBe(4);
});

test('POST /api/pets recusa especie fora da lista', async () => {
  const resposta = await request(app)
    .post('/api/pets')
    .send({ ...petValido, especie: 'dragao' });

  expect(resposta.status).toBe(400);
});

test('GET /api/pets/:id retorna o pet cadastrado', async () => {
  const criado = await request(app).post('/api/pets').send(petValido);
  const resposta = await request(app).get(`/api/pets/${criado.body.dados.id}`);

  expect(resposta.status).toBe(200);
  expect(resposta.body.dados.tutor).toBe('Marina');
});

test('GET /api/pets/:id responde 404 quando o pet nao existe', async () => {
  const resposta = await request(app).get('/api/pets/999');

  expect(resposta.status).toBe(404);
});

test('DELETE /api/pets/:id remove o pet', async () => {
  const criado = await request(app).post('/api/pets').send(petValido);
  const resposta = await request(app).delete(`/api/pets/${criado.body.dados.id}`);

  expect(resposta.status).toBe(204);

  const lista = await request(app).get('/api/pets');
  expect(lista.body.total).toBe(0);
});

test('DELETE /api/pets/:id responde 404 quando o pet nao existe', async () => {
  const resposta = await request(app).delete('/api/pets/999');

  expect(resposta.status).toBe(404);
});
