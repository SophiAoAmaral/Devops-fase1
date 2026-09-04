const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pets = require('./pets');
const { registro, medir, petsCadastrados } = require('./metrics');

const app = express();

const VERSAO = process.env.APP_VERSION || 'dev';
const ORIGENS = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: ORIGENS.includes('*') ? '*' : ORIGENS }));
app.use(express.json({ limit: '10kb' }));
app.use(medir);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', versao: VERSAO, tempoDeVida: process.uptime() });
});

app.get('/ready', (req, res) => {
  if (app.locals.encerrando) {
    return res.status(503).json({ status: 'encerrando' });
  }
  return res.json({ status: 'pronto', versao: VERSAO });
});

app.get('/metrics', async (req, res) => {
  petsCadastrados.set(pets.listar().length);
  res.set('Content-Type', registro.contentType);
  res.send(await registro.metrics());
});

app.get('/api/pets', (req, res) => {
  const lista = pets.listar();
  res.json({ total: lista.length, dados: lista });
});

app.get('/api/pets/:id', (req, res) => {
  const pet = pets.buscar(req.params.id);

  if (!pet) {
    return res.status(404).json({ erro: 'Pet nao encontrado.' });
  }
  return res.json({ dados: pet });
});

app.post('/api/pets', (req, res) => {
  const erros = pets.validar(req.body);

  if (erros.length > 0) {
    return res.status(400).json({ erro: 'Dados invalidos.', detalhes: erros });
  }
  return res.status(201).json({ dados: pets.criar(req.body) });
});

app.delete('/api/pets/:id', (req, res) => {
  const removido = pets.remover(req.params.id);

  if (!removido) {
    return res.status(404).json({ erro: 'Pet nao encontrado.' });
  }
  return res.status(204).send();
});

module.exports = app;
