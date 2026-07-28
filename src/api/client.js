const BASE_URL = import.meta.env.VITE_API_URL;

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
    throw new ErroApi(resposta.status, corpo);
  }

  return corpo;
}

export { requisitar, ErroApi };
