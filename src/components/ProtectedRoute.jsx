import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ papeisPermitidos, children }) {
  const { sessao } = useAuth();
  const localizacao = useLocation();

  if (!sessao) {
    return <Navigate to="/login" replace />;
  }

  if (sessao.usuario.deveTrocarSenha && localizacao.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }

  if (sessao.usuario.cadastroIncompleto && localizacao.pathname !== '/completar-cadastro') {
    return <Navigate to="/completar-cadastro" replace />;
  }

  const temPapel = !papeisPermitidos || sessao.usuario.papeis?.some((papel) => papeisPermitidos.includes(papel));
  if (papeisPermitidos && !temPapel) {
    return (
      <div className="m-8 rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">
        Seus papéis ({sessao.usuario.papeis?.join(', ')}) não têm acesso a esta tela. É preciso um dos papéis: {papeisPermitidos.join(', ')}.
      </div>
    );
  }

  return children;
}
