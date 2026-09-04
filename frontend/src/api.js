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
