const express = require('express');
const cors = require('cors');
const pets = require('./pets');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
