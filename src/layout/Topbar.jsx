import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Plus, LogOut } from 'lucide-react';
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

// aoAbrirMenu: abre a gaveta do menu lateral (o botão só existe abaixo de 1024px).
export function Topbar({ aoAbrirMenu }) {
  const { sessao, logout } = useAuth();
  const navigate = useNavigate();
  const podeSolicitar = sessao?.usuario?.papeis?.some((papel) => PAPEIS_PODEM_SOLICITAR.includes(papel));

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-bg-card px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={aoAbrirMenu}
        aria-label="Abrir menu"
        aria-controls="menu-lateral"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-principal transition-colors hover:bg-bg-app lg:hidden"
      >
        <Menu className="size-6" strokeWidth={2} aria-hidden="true" />
      </button>

      {/* Os atalhos da barra somem no celular: o menu lateral já leva às mesmas telas. */}
      <nav className="hidden items-center gap-6 md:flex">
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

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
        {podeSolicitar && (
          <button
            type="button"
            onClick={() => navigate('/remocoes/nova')}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-vermelho px-3 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-vermelho/90 sm:px-4"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            NOVA REMOÇÃO
          </button>
        )}

        <div className="flex min-w-0 items-center gap-2 sm:pl-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-azul-petroleo text-xs font-semibold text-white">
            {iniciais(sessao?.usuario?.email)}
          </span>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm font-medium text-text-principal">{sessao?.usuario?.email}</p>
            <p className="text-xs text-text-secundario">{sessao?.usuario?.papeis?.join(', ')}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sair"
            aria-label="Sair"
            className="ml-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secundario transition-colors hover:bg-bg-app hover:text-vermelho"
          >
            <LogOut className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
