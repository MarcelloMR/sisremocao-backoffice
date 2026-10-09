import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { itensNavegacao } from './navegacao.js';
import { useAuth } from '../context/AuthContext.jsx';
import icone from '../assets/logo/icone-256.png';

const LINK_CLASSES_BASE = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
const LINK_ATIVO = 'bg-white/10 text-white';
const LINK_INATIVO = 'text-text-secundario hover:bg-white/5 hover:text-white';

function ItemComSubmenu({ rotulo, Icone, subitens }) {
  const localizacao = useLocation();
  const contemRotaAtiva = subitens.some((sub) => localizacao.pathname === sub.caminho);
  const [aberto, setAberto] = useState(contemRotaAtiva);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className={`${LINK_CLASSES_BASE} w-full ${contemRotaAtiva ? LINK_ATIVO : LINK_INATIVO}`}
      >
        <Icone className="size-5" strokeWidth={2} />
        <span className="flex-1 text-left">{rotulo}</span>
        <ChevronDown className={`size-4 transition-transform ${aberto ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {aberto && (
        <div className="mt-1 flex flex-col gap-1 pl-8">
          {subitens.map(({ rotulo: subRotulo, caminho }) => (
            <NavLink
              key={caminho}
              to={caminho}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? LINK_ATIVO : LINK_INATIVO}`
              }
            >
              {subRotulo}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sessao } = useAuth();
  const itens = itensNavegacao(sessao?.usuario?.papeis, sessao?.usuario?.clienteTipo);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-chumbo">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-1">
          <img src={icone} alt="" className="size-full object-contain" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Pró Coração</p>
          <p className="text-xs text-text-secundario">Gerência de Remoção</p>
        </div>
      </div>

      <nav className="mt-4 flex flex-col gap-1 px-3">
        {itens.map((item) =>
          item.subitens ? (
            <ItemComSubmenu key={item.rotulo} {...item} />
          ) : (
            <NavLink
              key={item.caminho}
              to={item.caminho}
              end={item.caminho === '/'}
              className={({ isActive }) => `${LINK_CLASSES_BASE} ${isActive ? LINK_ATIVO : LINK_INATIVO}`}
            >
              <item.Icone className="size-5" strokeWidth={2} />
              {item.rotulo}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
