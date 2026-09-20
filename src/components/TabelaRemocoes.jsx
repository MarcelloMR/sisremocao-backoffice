import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPO_CLASSES } from './CampoFormulario.jsx';

const STATUS_REMOCAO = ['Solicitada', 'Em_Andamento', 'Realizada', 'Aguardando_Pagamento', 'Paga', 'Cancelada'];

// props:
// - comFiltros: mostra campo de busca por status acima da tabela
// - comFiltroPeriodo: mostra campos de data início/fim (filtra por dataHoraSolicitacao)
// - mostrarAlocar: mostra ação "Alocar equipe/ambulância" por linha (uso interno/Admin)
export function TabelaRemocoes({ comFiltros = true, comFiltroPeriodo = false, mostrarAlocar = false }) {
  const { sessao } = useAuth();
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [remocoes, setRemocoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const parametros = new URLSearchParams();
      if (status) parametros.set('status', status);
      if (dataInicio) parametros.set('dataInicio', dataInicio);
      if (dataFim) parametros.set('dataFim', dataFim);
      const resposta = await requisitar(`/remocao?${parametros.toString()}`, { token: sessao.token });
      setRemocoes(resposta);
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
      {(comFiltros || comFiltroPeriodo) && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            buscar();
          }}
          className="flex flex-wrap items-end gap-3 rounded-xl bg-bg-card p-4 shadow-sm"
        >
          {comFiltros && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={CAMPO_CLASSES}>
                <option value="">Todos</option>
                {STATUS_REMOCAO.map((item) => (
                  <option key={item} value={item}>
                    {item.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
          )}

          {comFiltroPeriodo && (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
                De
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={CAMPO_CLASSES} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
                Até
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={CAMPO_CLASSES} />
              </label>
            </>
          )}

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
              <th className="px-5 py-3 font-bold">Código</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 font-bold">Solicitada em</th>
              <th className="px-5 py-3 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!carregando && remocoes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm font-medium text-text-secundario">
                  Nenhuma remoção encontrada.
                </td>
              </tr>
            )}
            {remocoes.map((remocao) => (
              <tr key={remocao.codigo} className="border-t border-text-secundario/10">
                <td className="px-5 py-3 font-medium text-text-principal">#{remocao.codigo}</td>
                <td className="px-5 py-3 text-text-secundario">{remocao.status.replace('_', ' ')}</td>
                <td className="px-5 py-3 text-text-secundario">
                  {remocao.dataHoraSolicitacao ? new Date(remocao.dataHoraSolicitacao).toLocaleString('pt-BR') : '—'}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-3">
                    <Link to={`/remocoes/${remocao.codigo}`} className="font-medium text-azul-petroleo hover:underline">
                      Detalhar
                    </Link>
                    {mostrarAlocar && (
                      <Link to={`/remocoes/${remocao.codigo}/alocar`} className="font-medium text-azul-petroleo hover:underline">
                        Alocar
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
