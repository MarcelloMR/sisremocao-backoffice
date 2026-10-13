const BASE_URL = import.meta.env.VITE_API_URL;

// Evento disparado quando a API recusa o token da sessão (vencido ou inválido). O AuthProvider escuta
// e leva o usuário para o login — nenhuma tela precisa tratar isso por conta própria.
export const EVENTO_SESSAO_EXPIRADA = 'sessao-expirada';

// É a mensagem do middleware `autenticar` da API. Outros 401 com token (ex: "Senha atual incorreta"
// ao trocar a senha) não significam sessão vencida e não devem deslogar ninguém.
const ERRO_TOKEN_RECUSADO = 'Token inválido ou expirado';

class ErroApi extends Error {
  constructor(status, corpo) {
    super(corpo?.error || 'Erro na requisição');
    this.status = status;
    this.code = corpo?.code;
    this.cause = corpo?.cause;
    this.detalhes = corpo?.detalhes;
  }
}

async function requisitar(caminho, { method = 'GET', body, token } = {}) {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    if (resposta.status === 401 && token && corpo?.error === ERRO_TOKEN_RECUSADO) {
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new ErroApi(resposta.status, corpo);
  }

  return corpo;
}

export { requisitar, ErroApi };
