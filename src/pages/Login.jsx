import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import lockup from '../assets/logo/lockup-horizontal.png';

export function Login() {
  const { login } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const sessao = await login(email, senha);
      navegar(sessao.usuario.deveTrocarSenha ? '/trocar-senha' : '/');
    } catch (excecao) {
      setErro(excecao.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app px-4">
      <form onSubmit={aoSubmeter} className="w-full max-w-sm rounded-xl bg-bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={lockup} alt="Pró Coração" className="h-16 w-auto object-contain" />
          <p className="text-sm text-text-secundario">Gerência de Remoção — Backoffice</p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-text-secundario/30 px-3 py-2 text-sm font-normal outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="rounded-lg border border-text-secundario/30 px-3 py-2 text-sm font-normal outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo"
            />
          </label>

          {erro && <p className="text-sm font-medium text-vermelho">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 rounded-lg bg-vermelho py-2.5 text-sm font-semibold text-white transition-colors hover:bg-vermelho/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
