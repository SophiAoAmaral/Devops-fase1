let pets = [];
let proximoId = 1;

const ESPECIES = ['cao', 'gato', 'ave', 'roedor'];

function listar() {
  return pets;
}

function buscar(id) {
  return pets.find((pet) => pet.id === id);
}

function criar(dados) {
  const pet = {
    id: String(proximoId++),
    nome: dados.nome,
    especie: dados.especie,
    idade: dados.idade,
    tutor: dados.tutor
  };
  pets.push(pet);
  return pet;
}

function remover(id) {
  const antes = pets.length;
  pets = pets.filter((pet) => pet.id !== id);
  return pets.length < antes;
}

function limpar() {
  pets = [];
  proximoId = 1;
}

function validar(dados) {
  const erros = [];

  if (!dados.nome || dados.nome.length < 2) {
    erros.push('O nome deve ter ao menos 2 caracteres.');
  }
  if (!ESPECIES.includes(dados.especie)) {
    erros.push(`A especie deve ser uma destas: ${ESPECIES.join(', ')}.`);
  }
  if (!Number.isInteger(dados.idade) || dados.idade < 0) {
    erros.push('A idade deve ser um numero inteiro maior ou igual a zero.');
  }
  if (!dados.tutor || dados.tutor.length < 3) {
    erros.push('O tutor deve ter ao menos 3 caracteres.');
  }

  return erros;
}

module.exports = { listar, buscar, criar, remover, limpar, validar, ESPECIES };
