import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { AvisoLoginModal } from '../components/AvisoLoginModal.jsx';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function AppLayout() {
  const { sessao } = useAuth();
  const [aviso, setAviso] = useState(null);
  // Abaixo de 1280px o menu lateral vira uma gaveta, aberta pelo botão da barra superior.
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();

  // Navegou para outra tela: a gaveta fecha sozinha.
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  useEffect(() => {
    const papeis = sessao?.usuario?.papeis || [];
    if (sessao.usuario.cadastroIncompleto) {
      return;
    }

    if (papeis.includes('Profissional')) {
      requisitar('/profissional/me/aviso-login', { token: sessao.token })
        .then(setAviso)
        .catch(() => {});
      return;
    }

    if (papeis.includes('Regulador') || papeis.includes('Admin')) {
      requisitar('/regulador/me/aviso-login', { token: sessao.token })
        .then((remocoes) => {
          if (remocoes.length > 0) {
            setAviso({ tipo: 'remocoes-solicitadas', remocoes });
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fecharAviso() {
    const tipo = aviso?.tipo;
    setAviso(null);
    try {
      if (tipo === 'escalado') {
        await requisitar('/profissional/me/aviso-login/marcar-visto', { method: 'POST', token: sessao.token });
      } else if (tipo === 'remocoes-solicitadas') {
        await requisitar('/regulador/me/aviso-login/marcar-visto', { method: 'POST', token: sessao.token });
      }
    } catch {
      // best-effort: se falhar, o aviso volta a aparecer no próximo login
    }
  }

  return (
    <div className="flex h-dvh bg-bg-app">
      <Sidebar aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar aoAbrirMenu={() => setMenuAberto(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <AvisoLoginModal aviso={aviso} aoFechar={fecharAviso} />
    </div>
  );
}
