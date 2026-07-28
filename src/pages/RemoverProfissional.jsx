import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function RemoverProfissional() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const navegar = useNavigate();
  const [profissional, setProfissional] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState(null);
  const [removido, setRemovido] = useState(false);

  useEffect(() => {
    requisitar(`/profissional/${codigo}`, { token: sessao.token })
      .then(setProfissional)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [codigo, sessao.token]);

  async function confirmarRemocao() {
    setRemovendo(true);
    setErro(null);
    try {
      await requisitar(`/profissional/${codigo}`, { method: 'DELETE', token: sessao.token });
      setRemovido(true);
      setTimeout(() => navegar('/profissionais/listar'), 1500);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setRemovendo(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (!profissional) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Profissional não encontrado.'}</p>;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-bold text-chumbo">Remover Profissional</h1>

      <div className="flex flex-col gap-4 rounded-xl bg-bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-vermelho" strokeWidth={2} />
          <div>
            <p className="text-sm font-medium text-text-principal">
              Tem certeza que deseja remover{' '}
              <strong>
                {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome}
              </strong>{' '}
              ({profissional.tipo.replace('_', ' ')})?
            </p>
            <p className="mt-1 text-sm text-text-secundario">
              O cadastro é desativado (não é excluído) — o histórico de remoções, disponibilidade e dados bancários é
              preservado. Um Admin pode reverter isso diretamente no banco, se necessário.
            </p>
          </div>
        </div>

        {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
        {removido && (
          <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">
            Profissional removido com sucesso.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={confirmarRemocao}
            disabled={removendo || removido}
            className="rounded-lg bg-vermelho px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-vermelho/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {removendo ? 'Removendo...' : 'Confirmar remoção'}
          </button>
          <Link
            to="/profissionais/listar"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-text-secundario transition-colors hover:bg-bg-app"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}
