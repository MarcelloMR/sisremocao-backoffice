import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
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

// Em telas largas (lg, 1024px+) fica fixa à esquerda, como sempre. Abaixo disso vira uma gaveta por
// cima do conteúdo: `aberto` controla a exibição, e ela fecha pelo X, pelo fundo escuro ou por Esc.
// Fechada no celular fica `invisible`, para os links não receberem foco de teclado/leitor de tela.
export function Sidebar({ aberto = false, aoFechar }) {
  const { sessao } = useAuth();
  const itens = itensNavegacao(sessao?.usuario?.papeis, sessao?.usuario?.clienteTipo);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        aoFechar?.();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, aoFechar]);

  return (
    <>
      {aberto && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={aoFechar} aria-hidden="true" />}
    <aside
      id="menu-lateral"
      className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-72 max-w-[85vw] shrink-0 flex-col overflow-y-auto bg-chumbo transition-[translate,visibility] duration-200 lg:visible lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
        aberto ? 'visible translate-x-0' : 'invisible -translate-x-full'
      }`}
    >
      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar menu"
        className="absolute top-4 right-3 flex size-10 items-center justify-center rounded-lg text-text-secundario transition-colors hover:bg-white/10 hover:text-white lg:hidden"
      >
        <X className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-1">
          <img src={icone} alt="" className="size-full object-contain" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Pró Coração</p>
          <p className="text-xs text-text-secundario">Gerência de Remoção</p>
        </div>
      </div>

      <nav className="mt-4 flex flex-col gap-1 px-3 pb-6">
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
    </>
  );
}
