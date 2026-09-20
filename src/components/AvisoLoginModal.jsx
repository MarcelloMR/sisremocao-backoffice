import { Link } from 'react-router-dom';

// Modal simples (overlay + card centralizado) para avisos pós-login.
// aviso.tipo:
// - 'escalado' | 'vagas-abertas': resultado de GET /profissional/me/aviso-login (Profissional)
// - 'remocoes-solicitadas': resultado de GET /regulador/me/aviso-login (Regulador/Admin)
export function AvisoLoginModal({ aviso, aoFechar }) {
  if (!aviso) {
    return null;
  }

  const temConteudo =
    aviso.tipo === 'escalado' || aviso.tipo === 'remocoes-solicitadas' ? aviso.remocoes?.length > 0 : aviso.vagas?.length > 0;
  if (!temConteudo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-chumbo/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-bg-card p-6 shadow-lg">
        {aviso.tipo === 'escalado' && (
          <>
            <h2 className="text-lg font-bold text-chumbo">Você foi escalado</h2>
            <p className="mt-1 text-sm text-text-secundario">Você está escalado nas remoções abaixo:</p>
            <ul className="mt-4 flex flex-col gap-2">
              {aviso.remocoes.map((remocao) => (
                <li key={remocao.codigo} className="rounded-lg bg-bg-app px-4 py-3 text-sm">
                  <Link to={`/remocoes/${remocao.codigo}`} className="font-medium text-azul-petroleo hover:underline">
                    Remoção #{remocao.codigo}
                  </Link>
                  <span className="ml-2 text-text-secundario">{remocao.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {aviso.tipo === 'vagas-abertas' && (
          <>
            <h2 className="text-lg font-bold text-chumbo">Vagas disponíveis</h2>
            <p className="mt-1 text-sm text-text-secundario">Existem vagas em aberto compatíveis com seu tipo:</p>
            <ul className="mt-4 flex flex-col gap-2">
              {aviso.vagas.map((vaga) => (
                <li key={vaga.codigo} className="rounded-lg bg-bg-app px-4 py-3 text-sm">
                  <Link to="/profissional/remocoes" className="font-medium text-azul-petroleo hover:underline">
                    Remoção #{vaga.remocaoCodigo}
                  </Link>
                  {vaga.dataHoraAtendimento && (
                    <span className="ml-2 text-text-secundario">{new Date(vaga.dataHoraAtendimento).toLocaleString('pt-BR')}</span>
                  )}
                  {!vaga.disponivel && <span className="ml-2 text-vermelho">indisponível na sua grade</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        {aviso.tipo === 'remocoes-solicitadas' && (
          <>
            <h2 className="text-lg font-bold text-chumbo">Novas solicitações de remoção</h2>
            <p className="mt-1 text-sm text-text-secundario">Remoções aguardando escalação:</p>
            <ul className="mt-4 flex flex-col gap-2">
              {aviso.remocoes.map((remocao) => (
                <li key={remocao.codigo} className="rounded-lg bg-bg-app px-4 py-3 text-sm">
                  <Link to={`/remocoes/${remocao.codigo}`} className="font-medium text-azul-petroleo hover:underline">
                    Remoção #{remocao.codigo}
                  </Link>
                  {remocao.dataHoraSolicitacao && (
                    <span className="ml-2 text-text-secundario">{new Date(remocao.dataHoraSolicitacao).toLocaleString('pt-BR')}</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          type="button"
          onClick={aoFechar}
          className="mt-6 w-full rounded-lg bg-chumbo py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
