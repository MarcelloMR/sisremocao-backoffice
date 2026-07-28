import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPO_CLASSES } from './CampoFormulario.jsx';

const STATUS_AMBULANCIA = ['Disponivel', 'Ocupada', 'Revisao_Oficina', 'Alugada'];

// props:
// - comFiltros: mostra campos de busca (status/apenas disponíveis) acima da tabela
// - mostrarDetalhar / mostrarEditar / mostrarRemover: quais ações aparecem por linha
export function TabelaAmbulancias({ comFiltros = true, mostrarDetalhar = true, mostrarEditar = true, mostrarRemover = true }) {
  const { sessao } = useAuth();
  const [status, setStatus] = useState('');
  const [apenasDisponiveis, setApenasDisponiveis] = useState(false);
  const [ambulancias, setAmbulancias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const parametros = new URLSearchParams();
      if (status) parametros.set('status', status);
      if (apenasDisponiveis) parametros.set('disponivel', 'true');
      const resposta = await requisitar(`/ambulancia?${parametros.toString()}`, { token: sessao.token });
      setAmbulancias(resposta);
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

  const mostrarAcoes = mostrarDetalhar || mostrarEditar || mostrarRemover;

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
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              {STATUS_AMBULANCIA.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 pb-2 text-sm font-medium text-text-principal">
            <input
              type="checkbox"
              checked={apenasDisponiveis}
              onChange={(e) => setApenasDisponiveis(e.target.checked)}
              className="size-4"
            />
            Somente disponíveis
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
              <th className="px-5 py-3 font-bold">Nº identificação</th>
              <th className="px-5 py-3 font-bold">Placa</th>
              <th className="px-5 py-3 font-bold">Modelo</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 font-bold">UTI Móvel</th>
              {mostrarAcoes && <th className="px-5 py-3 font-bold">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {!carregando && ambulancias.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm font-medium text-text-secundario">
                  Nenhuma ambulância encontrada.
                </td>
              </tr>
            )}
            {ambulancias.map((ambulancia) => (
              <tr key={ambulancia.codigo} className="border-t border-text-secundario/10">
                <td className="px-5 py-3 font-medium text-text-principal">{ambulancia.numeroIdentificacao ?? '—'}</td>
                <td className="px-5 py-3 text-text-principal">{ambulancia.placaIdentificador}</td>
                <td className="px-5 py-3 text-text-principal">{ambulancia.modelo}</td>
                <td className="px-5 py-3 text-text-secundario">{ambulancia.status.replace('_', ' ')}</td>
                <td className="px-5 py-3 text-text-secundario">{ambulancia.utiMovel ? 'Sim' : 'Não'}</td>
                {mostrarAcoes && (
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      {mostrarDetalhar && (
                        <Link to={`/ambulancias/${ambulancia.codigo}`} className="font-medium text-azul-petroleo hover:underline">
                          Detalhar
                        </Link>
                      )}
                      {mostrarEditar && (
                        <Link to={`/ambulancias/${ambulancia.codigo}/editar`} className="font-medium text-azul-petroleo hover:underline">
                          Editar
                        </Link>
                      )}
                      {mostrarRemover && (
                        <Link to={`/ambulancias/${ambulancia.codigo}/remover`} className="font-medium text-vermelho hover:underline">
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
