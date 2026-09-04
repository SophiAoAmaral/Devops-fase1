import { listarPets, criarPet } from './api';

const petValido = { nome: 'Bidu', especie: 'cao', idade: 4, tutor: 'Marina' };

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ total: 0, dados: [] }) })
  );
});

test('chama a API na mesma origem quando VITE_API_URL nao esta definido', async () => {
  await listarPets();

  expect(global.fetch).toHaveBeenCalledWith('/api/pets');
});

test('envia o pet como JSON no POST', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ dados: { id: '1' } }) })
  );

  await criarPet(petValido);

  const [caminho, opcoes] = global.fetch.mock.calls[0];
  expect(caminho).toBe('/api/pets');
  expect(opcoes.method).toBe('POST');
  expect(JSON.parse(opcoes.body)).toEqual(petValido);
});

test('propaga as mensagens de validacao devolvidas pela API', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ erro: 'Dados invalidos.', detalhes: ['Nome curto.'] })
    })
  );

  await expect(criarPet({})).rejects.toThrow('Nome curto.');
});

test('avisa quando a listagem falha', async () => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }));

  await expect(listarPets()).rejects.toThrow('Nao foi possivel carregar os pets.');
});
