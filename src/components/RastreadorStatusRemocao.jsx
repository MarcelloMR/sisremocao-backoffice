import { SEQUENCIA_STATUS_REMOCAO, rotuloStatus } from '../constants/statusRemocao.js';

// Trilha visual do fluxo de status da remoção (ver migração 0024 no backend). Se a remoção está
// Cancelada, mostra só um selo — não faz sentido posicioná-la na trilha, já que Cancelada é um
// estado terminal à parte, não um passo da sequência.
export function RastreadorStatusRemocao({ status }) {
  if (status === 'Cancelada') {
    return (
      <div className="rounded-xl bg-vermelho/10 px-4 py-3 text-sm font-semibold text-vermelho">Remoção cancelada</div>
    );
  }

  const indiceAtual = SEQUENCIA_STATUS_REMOCAO.indexOf(status);

  return (
    <div className="overflow-x-auto rounded-xl bg-bg-card p-4 shadow-sm">
      <ol className="flex min-w-max items-center">
        {SEQUENCIA_STATUS_REMOCAO.map((etapa, indice) => {
          const concluida = indice < indiceAtual;
          const atual = indice === indiceAtual;
          return (
            <li key={etapa} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={
                    'flex size-7 items-center justify-center rounded-full text-xs font-bold ' +
                    (atual
                      ? 'bg-azul-petroleo text-white'
                      : concluida
                        ? 'bg-azul-petroleo/20 text-azul-petroleo'
                        : 'bg-text-secundario/10 text-text-secundario')
                  }
                >
                  {indice + 1}
                </div>
                <span
                  className={
                    'w-20 text-center text-[11px] font-medium leading-tight ' +
                    (atual ? 'text-chumbo' : 'text-text-secundario')
                  }
                >
                  {rotuloStatus(etapa)}
                </span>
              </div>
              {indice < SEQUENCIA_STATUS_REMOCAO.length - 1 && (
                <div className={'mx-1 h-0.5 w-8 shrink-0 ' + (concluida ? 'bg-azul-petroleo/40' : 'bg-text-secundario/10')} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
