import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ total: 0, dados: [] }) })
  );
});

test('mostra o titulo da aplicacao', async () => {
  render(<App />);

  expect(await screen.findByText('PetHub')).toBeInTheDocument();
});

test('avisa quando nao ha pets cadastrados', async () => {
  render(<App />);

  expect(await screen.findByText('Nenhum pet cadastrado ainda.')).toBeInTheDocument();
});

test('mostra os pets que a API retornou', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          total: 1,
          dados: [{ id: '1', nome: 'Bidu', especie: 'cao', idade: 4, tutor: 'Marina' }]
        })
    })
  );

  render(<App />);

  expect(await screen.findByText('Bidu')).toBeInTheDocument();
  expect(screen.getByText(/Pets cadastrados \(1\)/)).toBeInTheDocument();
});

test('exibe o formulario de cadastro', async () => {
  render(<App />);

  expect(await screen.findByLabelText('Nome')).toBeInTheDocument();
  expect(screen.getByLabelText('Espécie')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeInTheDocument();
});
