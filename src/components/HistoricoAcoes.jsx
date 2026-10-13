import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatarDataHora } from './auditoriaFormato.js';
import { ResultadoAuditoria } from './ResultadoAuditoria.jsx';

const QUANTIDADE = 10;

// Bloco "Histórico de ações" das telas de detalhe: as últimas ações de escrita sobre um registro
// (ex: entidade="remocao", codigo=12), vindas da trilha de auditoria. A trilha é só do Admin — para
// os demais papéis o bloco simplesmente não aparece (e a API recusaria a consulta).
export function HistoricoAcoes({ entidade, codigo }) {
  const { sessao } = useAuth();
  const ehAdmin = Boolean(sessao.usuario.papeis?.includes('Admin'));
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!ehAdmin || codigo == null) {
      return;
    }
    const parametros = new URLSearchParams({ entidade, entidadeCodigo: String(codigo), limite: String(QUANTIDADE) });
    requisitar(`/auditoria?${parametros.toString()}`, { token: sessao.token })
      .then(setResposta)
      .catch((excecao) => setErro(excecao.cause || excecao.message));
  }, [ehAdmin, entidade, codigo, sessao.token]);

  if (!ehAdmin) {
    return null;
  }

  const linkCompleto = `/auditoria?entidade=${entidade}&entidadeCodigo=${codigo}&periodo=tudo`;

  return (
    <section className="rounded-xl bg-bg-card p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">Histórico de ações</h2>
        {resposta && resposta.total > 0 && (
          <Link to={linkCompleto} className="text-sm font-medium text-azul-petroleo hover:underline">
            {resposta.total > resposta.itens.length ? `Ver as ${resposta.total} na Auditoria` : 'Abrir na Auditoria'}
          </Link>
        )}
      </div>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {!erro && !resposta && <p className="text-sm text-text-secundario">Carregando...</p>}
      {resposta && resposta.itens.length === 0 && (
        <p className="text-sm text-text-secundario">Nenhuma ação registrada para este registro nos últimos 6 meses.</p>
      )}

      {resposta && resposta.itens.length > 0 && (
        <ul className="flex flex-col divide-y divide-text-secundario/10">
          {resposta.itens.map((item) => (
            <li key={item.codigo} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5 text-sm">
              <span className="w-40 shrink-0 tabular-nums text-text-secundario">{formatarDataHora(item.ocorridoEm)}</span>
              <span className="min-w-48 flex-1 font-medium text-text-principal">{item.descricao}</span>
              <span className="text-text-secundario">{item.usuario.email || '—'}</span>
              <ResultadoAuditoria item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
