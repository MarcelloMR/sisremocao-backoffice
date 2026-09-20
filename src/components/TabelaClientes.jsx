import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPO_CLASSES } from './CampoFormulario.jsx';

// props:
// - comFiltros: mostra campo de busca por UF acima da tabela
export function TabelaClientes({ comFiltros = true }) {
  const { sessao } = useAuth();
  const [uf, setUf] = useState('');
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const parametros = new URLSearchParams();
      if (uf) parametros.set('uf', uf);
      const resposta = await requisitar(`/cliente?${parametros.toString()}`, { token: sessao.token });
      setClientes(resposta);
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
            UF
            <input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} maxLength={2} className={CAMPO_CLASSES} />
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
              <th className="px-5 py-3 font-bold">Nome fantasia</th>
              <th className="px-5 py-3 font-bold">CNPJ</th>
              <th className="px-5 py-3 font-bold">UF</th>
              <th className="px-5 py-3 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!carregando && clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm font-medium text-text-secundario">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {clientes.map((cliente) => (
              <tr key={cliente.codigo} className="border-t border-text-secundario/10">
                <td className="px-5 py-3 font-medium text-text-principal">{cliente.nomeFantasia}</td>
                <td className="px-5 py-3 text-text-secundario">{cliente.cnpj || '—'}</td>
                <td className="px-5 py-3 text-text-secundario">{cliente.uf || '—'}</td>
                <td className="px-5 py-3">
                  <Link to={`/clientes/${cliente.codigo}`} className="font-medium text-azul-petroleo hover:underline">
                    Detalhar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
