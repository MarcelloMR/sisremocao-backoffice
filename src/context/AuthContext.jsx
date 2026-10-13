import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { requisitar, EVENTO_SESSAO_EXPIRADA } from '../api/client.js';

const AuthContext = createContext(null);

// Sessão por inatividade (decisão de produto de 2026-10-13): sem nenhuma ação por 30 minutos, a
// sessão acaba. O token da API também vale 30 minutos; enquanto a pessoa usa o sistema, ele é
// trocado por um novo em POST /auth/renovar, então quem está trabalhando não é desconectado.
const INATIVIDADE_MAXIMA_MS = 30 * 60 * 1000;
// Com uso, o token é renovado quando passa desta idade — bem antes de vencer, para uma renovação
// que falhe por queda de rede ter várias chances de se repetir.
const RENOVAR_APOS_MS = 5 * 60 * 1000;
const INTERVALO_VERIFICACAO_MS = 30 * 1000;
// A última atividade fica no localStorage para valer entre abas: mexer em uma mantém as outras.
const CHAVE_SESSAO = 'sessao';
const CHAVE_ULTIMA_ATIVIDADE = 'ultimaAtividade';
const GRAVAR_ATIVIDADE_A_CADA_MS = 10 * 1000;
const EVENTOS_DE_ATIVIDADE = ['pointerdown', 'keydown', 'touchstart', 'wheel'];

// Recado para a tela de login explicar por que a pessoa foi parar lá. Fica no sessionStorage para
// sobreviver ao redirecionamento e sumir sozinho ao fechar a aba.
const CHAVE_AVISO_LOGIN = 'avisoLogin';

export function lerAvisoLogin() {
  const aviso = sessionStorage.getItem(CHAVE_AVISO_LOGIN);
  sessionStorage.removeItem(CHAVE_AVISO_LOGIN);
  return aviso;
}

// O token é um JWT: emissão (iat) e vencimento (exp), em segundos, vêm no próprio corpo. Só leitura
// para decidir a navegação — quem valida de verdade é a API.
function lerPrazosDoToken(token) {
  try {
    const corpo = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { emitidoEm: (corpo.iat || 0) * 1000, venceEm: typeof corpo.exp === 'number' ? corpo.exp * 1000 : 0 };
  } catch {
    return { emitidoEm: 0, venceEm: 0 };
  }
}

function lerUltimaAtividade() {
  return Number(localStorage.getItem(CHAVE_ULTIMA_ATIVIDADE)) || 0;
}

function sessaoVencida(sessao) {
  if (!sessao?.token) {
    return true;
  }
  const agora = Date.now();
  const ultimaAtividade = lerUltimaAtividade();
  const parada = ultimaAtividade > 0 && agora - ultimaAtividade >= INATIVIDADE_MAXIMA_MS;
  return parada || lerPrazosDoToken(sessao.token).venceEm <= agora;
}

function encerrarSessaoExpirada() {
  localStorage.removeItem(CHAVE_SESSAO);
  localStorage.removeItem(CHAVE_ULTIMA_ATIVIDADE);
  sessionStorage.setItem(CHAVE_AVISO_LOGIN, 'Sua sessão expirou por inatividade. Entre novamente para continuar.');
}

// Sessão guardada já vencida (ex: aba reaberta no dia seguinte) é descartada antes de qualquer tela
// carregar: a pessoa cai direto no login, em vez de ver uma tela vazia com erro de token.
function lerSessaoSalva() {
  const bruto = localStorage.getItem(CHAVE_SESSAO);
  if (!bruto) {
    return null;
  }
  const sessao = JSON.parse(bruto);
  if (sessaoVencida(sessao)) {
    encerrarSessaoExpirada();
    return null;
  }
  return sessao;
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoSalva);
  const ultimaGravacao = useRef(0);
  const renovando = useRef(false);

  const guardarSessao = useCallback((novaSessao) => {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(novaSessao));
    setSessao(novaSessao);
  }, []);

  const login = useCallback(
    async (email, senha) => {
      const resposta = await requisitar('/auth/login', { method: 'POST', body: { email, senha } });
      const novaSessao = { token: resposta.token, usuario: resposta.usuario };
      localStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(Date.now()));
      guardarSessao(novaSessao);
      return novaSessao;
    },
    [guardarSessao]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(CHAVE_SESSAO);
    localStorage.removeItem(CHAVE_ULTIMA_ATIVIDADE);
    setSessao(null);
  }, []);

  const expirar = useCallback(() => {
    encerrarSessaoExpirada();
    setSessao(null);
  }, []);

  // Token recusado pela API no meio do uso: encerra a sessão. Sem sessão, o ProtectedRoute
  // redireciona para /login, que mostra o recado.
  useEffect(() => {
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, expirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, expirar);
  }, [expirar]);

  // Outra aba entrou, saiu ou renovou a sessão: esta acompanha.
  useEffect(() => {
    const aoMudarArmazenamento = (evento) => {
      if (evento.key === CHAVE_SESSAO) {
        setSessao(evento.newValue ? JSON.parse(evento.newValue) : null);
      }
    };
    window.addEventListener('storage', aoMudarArmazenamento);
    return () => window.removeEventListener('storage', aoMudarArmazenamento);
  }, []);

  // Registra o uso: clique, tecla, toque ou rolagem. Grava no máximo a cada 10 segundos, para não
  // escrever no armazenamento a cada tecla digitada.
  useEffect(() => {
    if (!sessao) {
      return undefined;
    }
    const registrarAtividade = () => {
      const agora = Date.now();
      if (agora - ultimaGravacao.current >= GRAVAR_ATIVIDADE_A_CADA_MS) {
        ultimaGravacao.current = agora;
        localStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(agora));
      }
    };
    for (const nome of EVENTOS_DE_ATIVIDADE) {
      window.addEventListener(nome, registrarAtividade, { passive: true });
    }
    return () => {
      for (const nome of EVENTOS_DE_ATIVIDADE) {
        window.removeEventListener(nome, registrarAtividade);
      }
    };
  }, [sessao]);

  // A cada 30 segundos: encerra se a pessoa está parada há 30 minutos (ou o token venceu) e renova
  // o token se houve uso desde que ele foi emitido. Também confere ao voltar para a aba, porque o
  // navegador pode ter pausado o temporizador com a aba em segundo plano ou o aparelho bloqueado.
  useEffect(() => {
    if (!sessao) {
      return undefined;
    }

    const verificar = async () => {
      if (sessaoVencida(sessao)) {
        expirar();
        return;
      }

      const { emitidoEm } = lerPrazosDoToken(sessao.token);
      const houveUsoDesdeAEmissao = lerUltimaAtividade() > emitidoEm;
      if (!houveUsoDesdeAEmissao || Date.now() - emitidoEm < RENOVAR_APOS_MS || renovando.current) {
        return;
      }

      renovando.current = true;
      try {
        const resposta = await requisitar('/auth/renovar', { method: 'POST', token: sessao.token });
        guardarSessao({ token: resposta.token, usuario: resposta.usuario });
      } catch (excecao) {
        // 401: a conta foi desativada ou o token deixou de valer. Qualquer outra falha (rede fora,
        // API reiniciando) é passageira: o token atual segue valendo e a próxima verificação tenta
        // de novo.
        if (excecao.status === 401) {
          expirar();
        }
      } finally {
        renovando.current = false;
      }
    };

    const aoVoltarParaAAba = () => {
      if (document.visibilityState === 'visible') {
        verificar();
      }
    };

    const temporizador = setInterval(verificar, INTERVALO_VERIFICACAO_MS);
    document.addEventListener('visibilitychange', aoVoltarParaAAba);
    return () => {
      clearInterval(temporizador);
      document.removeEventListener('visibilitychange', aoVoltarParaAAba);
    };
  }, [sessao, expirar, guardarSessao]);

  const atualizarUsuario = useCallback((patch) => {
    setSessao((atual) => {
      if (!atual) {
        return atual;
      }
      const nova = { ...atual, usuario: { ...atual.usuario, ...patch } };
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(nova));
      return nova;
    });
  }, []);

  return <AuthContext.Provider value={{ sessao, login, logout, atualizarUsuario }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return contexto;
}
