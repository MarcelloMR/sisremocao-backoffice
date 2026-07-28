import { AlertTriangle, Ambulance, ClipboardList, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const CARTOES_RESUMO = [
  { rotulo: 'Solicitações pendentes', valor: '—', Icone: ClipboardList },
  { rotulo: 'Remoções em andamento', valor: '—', Icone: Ambulance },
  { rotulo: 'Ambulâncias disponíveis', valor: '—', Icone: AlertTriangle },
  { rotulo: 'Apólices vencendo', valor: '—', Icone: ShieldAlert },
];

export function Home() {
  const { sessao } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Visão Geral</h1>
        <p className="mt-1 text-sm text-text-secundario">
          Bem-vindo(a), {sessao.usuario.email} · papel <span className="font-medium text-text-principal">{sessao.usuario.papel}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARTOES_RESUMO.map(({ rotulo, valor, Icone }) => (
          <div key={rotulo} className="rounded-xl bg-bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secundario">{rotulo}</p>
              <Icone className="size-5 text-azul-petroleo" strokeWidth={2} />
            </div>
            <p className="mt-3 text-3xl font-bold text-chumbo">{valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl bg-bg-card shadow-sm">
          <header className="bg-azul-petroleo px-5 py-3">
            <h2 className="text-sm font-bold text-white">Fila de Solicitações</h2>
          </header>
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-center">
            <p className="text-sm font-medium text-text-secundario">Nenhum dado carregado ainda.</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-bg-card shadow-sm">
          <header className="bg-azul-petroleo px-5 py-3">
            <h2 className="text-sm font-bold text-white">Remoções Executadas</h2>
          </header>
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-center">
            <p className="text-sm font-medium text-text-secundario">Nenhum dado carregado ainda.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
