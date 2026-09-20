import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS_DISCRETOS = [
  { rotulo: 'Visão Geral', caminho: '/' },
  { rotulo: 'Relatórios', caminho: '/relatorios' },
];

// Quem pode solicitar remoção: Cliente (para si) ou Regulador (pedido recebido por telefone).
const PAPEIS_PODEM_SOLICITAR = ['Cliente', 'Regulador'];

function iniciais(email) {
  return (email || '?').slice(0, 2).toUpperCase();
}

export function Topbar() {
  const { sessao, logout } = useAuth();
  const navigate = useNavigate();
  const podeSolicitar = sessao?.usuario?.papeis?.some((papel) => PAPEIS_PODEM_SOLICITAR.includes(papel));

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-bg-card px-8">
      <nav className="flex items-center gap-6">
        {LINKS_DISCRETOS.map(({ rotulo, caminho }) => (
          <NavLink
            key={caminho}
            to={caminho}
            end={caminho === '/'}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-text-principal' : 'text-text-secundario hover:text-text-principal'
              }`
            }
          >
            {rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {podeSolicitar && (
          <button
            type="button"
            onClick={() => navigate('/remocoes/nova')}
            className="flex items-center gap-2 rounded-lg bg-vermelho px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-vermelho/90"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            NOVA REMOÇÃO
          </button>
        )}

        <div className="flex items-center gap-2 pl-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-azul-petroleo text-xs font-semibold text-white">
            {iniciais(sessao?.usuario?.email)}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-text-principal">{sessao?.usuario?.email}</p>
            <p className="text-xs text-text-secundario">{sessao?.usuario?.papeis?.join(', ')}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sair"
            className="ml-1 flex size-8 items-center justify-center rounded-lg text-text-secundario transition-colors hover:bg-bg-app hover:text-vermelho"
          >
            <LogOut className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
