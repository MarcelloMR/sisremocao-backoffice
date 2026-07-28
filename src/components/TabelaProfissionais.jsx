import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPO_CLASSES } from './CampoFormulario.jsx';

const TIPOS_PROFISSIONAL = ['Medico', 'Enfermeiro', 'Motorista', 'Tecnico_Enfermagem'];

// props:
// - comFiltros: mostra campos de busca (nome/tipo) acima da tabela
// - mostrarEditar / mostrarRemover: quais ações aparecem por linha
export function TabelaProfissionais({ comFiltros = true, mostrarEditar = true, mostrarRemover = true }) {
  const { sessao } = useAuth();
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const parametros = new URLSearchParams();
      if (nome) parametros.set('nome', nome);
      if (tipo) parametros.set('tipo', tipo);
      const resposta = await requisitar(`/profissional?${parametros.toString()}`, { token: sessao.token });
      setProfissionais(resposta);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {comFiltros && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            buscar();
          }}
          className="flex flex-wrap items-end gap-3 rounded-xl bg-bg-card p-4 shadow-sm"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO_CLASSES} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              {TIPOS_PROFISSIONAL.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-chumbo px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90"
          >
            Buscar
          </button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}

      <div className="overflow-hidden rounded-xl bg-bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-azul-petroleo text-left text-white">
              <th className="px-5 py-3 font-bold">Nome</th>
              <th className="px-5 py-3 font-bold">Tipo</th>
              <th className="px-5 py-3 font-bold">E-mail</th>
              {(mostrarEditar || mostrarRemover) && <th className="px-5 py-3 font-bold">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {!carregando && profissionais.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm font-medium text-text-secundario">
                  Nenhum profissional encontrado.
                </td>
              </tr>
            )}
            {profissionais.map((profissional) => (
              <tr key={profissional.codigo} className="border-t border-text-secundario/10">
                <td className="px-5 py-3 font-medium text-text-principal">
                  {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome}
                </td>
                <td className="px-5 py-3 text-text-principal">{profissional.tipo.replace('_', ' ')}</td>
                <td className="px-5 py-3 text-text-secundario">{profissional.dadosPessoais.email || '—'}</td>
                {(mostrarEditar || mostrarRemover) && (
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      {mostrarEditar && (
                        <Link to={`/profissionais/${profissional.codigo}/editar`} className="font-medium text-azul-petroleo hover:underline">
                          Editar
                        </Link>
                      )}
                      {mostrarRemover && (
                        <Link to={`/profissionais/${profissional.codigo}/remover`} className="font-medium text-vermelho hover:underline">
                          Remover
                        </Link>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
