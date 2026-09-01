// Em producao o nginx do container serve o front-end e encaminha /api para a
// API, e em desenvolvimento o Vite faz o mesmo proxy. Nos dois casos o
// navegador fala com uma unica origem, por isso o padrao e a base vazia.
// VITE_API_URL so e necessario quando a API mora em outro dominio.
const BASE_API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function listarPets() {
  const resposta = await fetch(`${BASE_API}/api/pets`);

  if (!resposta.ok) {
    throw new Error('Nao foi possivel carregar os pets.');
  }
  const corpo = await resposta.json();
  return corpo.dados;
}

export async function criarPet(pet) {
  const resposta = await fetch(`${BASE_API}/api/pets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pet)
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.detalhes ? corpo.detalhes.join(' ') : corpo.erro);
  }
  return corpo.dados;
}
