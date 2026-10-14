import { useSearchParams } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { VisaoGeral } from '../components/relatorios/VisaoGeral.jsx';

const ABAS = [
  { valor: 'visao-geral', rotulo: 'Visão geral' },
  { valor: 'frota', rotulo: 'Frota' },
  { valor: 'fechamento', rotulo: 'Fechamento do mês' },
];

function EmBreve({ texto }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-text-secundario/30 bg-bg-card px-6 py-16 text-center">
      <Construction className="size-8 text-text-secundario" strokeWidth={1.5} aria-hidden="true" />
      <p className="max-w-md text-sm font-medium text-text-secundario">{texto}</p>
    </div>
  );
}

// Relatórios (só Admin). A aba fica na URL (?aba=), para dar para recarregar ou guardar o link.
export function Relatorios() {
  const [parametros, setParametros] = useSearchParams();
  const aba = ABAS.some((item) => item.valor === parametros.get('aba')) ? parametros.get('aba') : 'visao-geral';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Relatórios</h1>
        <p className="mt-1 text-sm text-text-secundario">Indicadores das remoções, da frota e o fechamento mensal.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-text-secundario/20" role="tablist" aria-label="Relatórios">
        {ABAS.map((item) => (
          <button
            key={item.valor}
            type="button"
            role="tab"
            aria-selected={aba === item.valor}
            onClick={() => setParametros(item.valor === 'visao-geral' ? {} : { aba: item.valor }, { replace: true })}
            className={`-mb-px min-h-11 border-b-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              aba === item.valor ? 'border-vermelho text-chumbo' : 'border-transparent text-text-secundario hover:text-text-principal'
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {aba === 'visao-geral' && <VisaoGeral />}
      {aba === 'frota' && <EmBreve texto="A aba Frota (disponibilidade, km por ambulância e registro de paradas) entra na próxima fase." />}
      {aba === 'fechamento' && <EmBreve texto="O Fechamento do mês (conferência, valores por profissional e exportação) entra na fase seguinte à da Frota." />}
    </div>
  );
}
