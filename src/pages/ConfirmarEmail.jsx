import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import lockup from '../assets/logo/lockup-horizontal.png';

export function ConfirmarEmail() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const tokenDaUrl = parametros.get('token');
  const [token, setToken] = useState(tokenDaUrl || '');
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function confirmar(tokenParaConfirmar) {
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await requisitar('/auth/confirmar-email', { method: 'POST', body: { token: tokenParaConfirmar } });
      setSucesso(
        resposta.cadastroIncompleto
          ? 'E-mail confirmado. Faça login com a senha temporária recebida por e-mail para completar seu cadastro.'
          : 'E-mail confirmado. Você já pode fazer login.'
      );
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setCarregando(false);
    }
  }

  // Link do e-mail já traz o token na URL (?token=XXXXXX) — confirma automaticamente ao carregar,
  // sem exigir que o usuário digite o código.
  useEffect(() => {
    if (tokenDaUrl) {
      confirmar(tokenDaUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenDaUrl]);

  function aoSubmeter(evento) {
    evento.preventDefault();
    confirmar(token);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app px-4">
      <form onSubmit={aoSubmeter} className="w-full max-w-sm rounded-xl bg-bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={lockup} alt="Pró Coração" className="h-16 w-auto object-contain" />
          <p className="text-sm text-text-secundario">
            {tokenDaUrl && carregando ? 'Confirmando seu e-mail...' : 'Confirme o código recebido por e-mail'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!(tokenDaUrl && carregando) && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
              Código de confirmação
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                maxLength={6}
                placeholder="000000"
                className="rounded-lg border border-text-secundario/30 px-3 py-2 text-center text-lg font-semibold tracking-[0.3em] outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo"
              />
            </label>
          )}

          {erro && <p className="text-sm font-medium text-vermelho">{erro}</p>}
          {sucesso && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-azul-petroleo">{sucesso}</p>
              <button
                type="button"
                onClick={() => navegar('/login')}
                className="rounded-lg bg-chumbo py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90"
              >
                Ir para o login
              </button>
            </div>
          )}

          {!sucesso && !(tokenDaUrl && carregando) && (
            <button
              type="submit"
              disabled={carregando}
              className="mt-2 rounded-lg bg-vermelho py-2.5 text-sm font-semibold text-white transition-colors hover:bg-vermelho/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? 'Confirmando...' : 'Confirmar'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
