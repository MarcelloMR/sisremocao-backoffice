import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import lockup from '../assets/logo/lockup-horizontal.png';
import { REGRAS_SENHA, senhaAtendePolitica } from '../utils/senha.js';

export function TrocarSenha() {
  const { sessao, atualizarUsuario, logout } = useAuth();
  const navegar = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const obrigatorio = sessao?.usuario?.deveTrocarSenha;
  const senhaValida = senhaAtendePolitica(novaSenha);
  const senhasConferem = novaSenha.length > 0 && novaSenha === confirmarSenha;

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);

    if (!senhaValida) {
      setErro('A nova senha não atende aos requisitos mínimos.');
      return;
    }
    if (!senhasConferem) {
      setErro('A confirmação não confere com a nova senha.');
      return;
    }

    setEnviando(true);
    try {
      await requisitar('/auth/trocar-senha', {
        method: 'POST',
        body: { senhaAtual, novaSenha },
        token: sessao.token,
      });
      atualizarUsuario({ deveTrocarSenha: false });
      setSucesso(true);
      setTimeout(() => navegar('/'), 1500);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app px-4">
      <form onSubmit={aoSubmeter} className="w-full max-w-sm rounded-xl bg-bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={lockup} alt="Pró Coração" className="h-16 w-auto object-contain" />
          <p className="text-sm text-text-secundario">
            {obrigatorio ? 'Por segurança, defina uma nova senha para continuar' : 'Trocar senha'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Senha atual
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              required
              className="rounded-lg border border-text-secundario/30 px-3 py-2 text-sm font-normal outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Nova senha
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              className="rounded-lg border border-text-secundario/30 px-3 py-2 text-sm font-normal outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Confirmar nova senha
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              className="rounded-lg border border-text-secundario/30 px-3 py-2 text-sm font-normal outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo"
            />
          </label>

          <ul className="flex flex-col gap-1 rounded-lg bg-bg-app p-3">
            {REGRAS_SENHA.map(({ chave, rotulo, testar }) => {
              const atende = testar(novaSenha);
              return (
                <li key={chave} className={`flex items-center gap-2 text-xs font-medium ${atende ? 'text-azul-petroleo' : 'text-text-secundario'}`}>
                  {atende ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={2.5} />}
                  {rotulo}
                </li>
              );
            })}
          </ul>

          {erro && <p className="text-sm font-medium text-vermelho">{erro}</p>}
          {sucesso && <p className="text-sm font-medium text-azul-petroleo">Senha atualizada com sucesso.</p>}

          <button
            type="submit"
            disabled={enviando || sucesso}
            className="mt-2 rounded-lg bg-vermelho py-2.5 text-sm font-semibold text-white transition-colors hover:bg-vermelho/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Salvando...' : 'Salvar nova senha'}
          </button>

          {!obrigatorio && (
            <button type="button" onClick={() => navegar('/')} className="text-sm font-medium text-text-secundario hover:underline">
              Cancelar
            </button>
          )}

          {obrigatorio && (
            <button type="button" onClick={logout} className="text-sm font-medium text-text-secundario hover:underline">
              Sair
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
