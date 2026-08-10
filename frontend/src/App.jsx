import { useEffect, useState } from 'react';
import { listarPets, criarPet } from './api';

const CAMPOS_VAZIOS = { nome: '', especie: 'cao', idade: '', tutor: '' };

export default function App() {
  const [pets, setPets] = useState([]);
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setPets(await listarPets());
    } catch (e) {
      setErro(e.message);
    }
  }

  function alterarCampo(evento) {
    setCampos({ ...campos, [evento.target.name]: evento.target.value });
  }

  async function cadastrar() {
    setErro('');
    try {
      await criarPet({ ...campos, idade: Number(campos.idade) });
      setCampos(CAMPOS_VAZIOS);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="pagina">
      <h1>PetHub</h1>
      <p className="subtitulo">Gestão de petshop — Fase 1</p>

      {erro && <p className="erro">{erro}</p>}

      <h2>Cadastrar pet</h2>

      <label htmlFor="nome">Nome</label>
      <input id="nome" name="nome" value={campos.nome} onChange={alterarCampo} />

      <label htmlFor="especie">Espécie</label>
      <select id="especie" name="especie" value={campos.especie} onChange={alterarCampo}>
        <option value="cao">cão</option>
        <option value="gato">gato</option>
        <option value="ave">ave</option>
        <option value="roedor">roedor</option>
      </select>

      <label htmlFor="idade">Idade</label>
      <input id="idade" name="idade" type="number" value={campos.idade} onChange={alterarCampo} />

      <label htmlFor="tutor">Tutor</label>
      <input id="tutor" name="tutor" value={campos.tutor} onChange={alterarCampo} />

      <button onClick={cadastrar}>Cadastrar</button>

      <h2>Pets cadastrados ({pets.length})</h2>

      {pets.length === 0 ? (
        <p>Nenhum pet cadastrado ainda.</p>
      ) : (
        <ul>
          {pets.map((pet) => (
            <li key={pet.id}>
              <strong>{pet.nome}</strong> — {pet.especie}, {pet.idade} ano(s), tutor: {pet.tutor}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
