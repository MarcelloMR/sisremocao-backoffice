import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { requisitar, EVENTO_SESSAO_EXPIRADA } from '../api/client.js';

const AuthContext = createContext(null);

// Recado para a tela de login explicar por que a pessoa foi parar lá. Fica no sessionStorage para
// sobreviver ao redirecionamento e sumir sozinho ao fechar a aba.
const CHAVE_AVISO_LOGIN = 'avisoLogin';

export function lerAvisoLogin() {
  const aviso = sessionStorage.getItem(CHAVE_AVISO_LOGIN);
  sessionStorage.removeItem(CHAVE_AVISO_LOGIN);
  return aviso;
}

// O token é um JWT: o vencimento (exp, em segundos) vem no próprio corpo. Só leitura para decidir a
// navegação — quem valida de verdade é a API.
function tokenVencido(token) {
  try {
    const corpo = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof corpo.exp === 'number' && corpo.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function encerrarSessaoExpirada() {
  localStorage.removeItem('sessao');
  sessionStorage.setItem(CHAVE_AVISO_LOGIN, 'Sua sessão expirou. Entre novamente para continuar.');
}

// Sessão guardada já vencida (ex: aba reaberta no dia seguinte) é descartada antes de qualquer tela
// carregar: a pessoa cai direto no login, em vez de ver uma tela vazia com erro de token.
function lerSessaoSalva() {
  const bruto = localStorage.getItem('sessao');
  if (!bruto) {
    return null;
  }
  const sessao = JSON.parse(bruto);
  if (!sessao?.token || tokenVencido(sessao.token)) {
    encerrarSessaoExpirada();
    return null;
  }
  return sessao;
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoSalva);

  const login = useCallback(async (email, senha) => {
    const resposta = await requisitar('/auth/login', { method: 'POST', body: { email, senha } });
    const novaSessao = { token: resposta.token, usuario: resposta.usuario };
    localStorage.setItem('sessao', JSON.stringify(novaSessao));
    setSessao(novaSessao);
    return novaSessao;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sessao');
    setSessao(null);
  }, []);

  // Token recusado pela API no meio do uso (venceu com a tela aberta): encerra a sessão. Sem sessão,
  // o ProtectedRoute redireciona para /login, que mostra o recado.
  useEffect(() => {
    const aoExpirar = () => {
      encerrarSessaoExpirada();
      setSessao(null);
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const atualizarUsuario = useCallback((patch) => {
    setSessao((atual) => {
      if (!atual) {
        return atual;
      }
      const nova = { ...atual, usuario: { ...atual.usuario, ...patch } };
      localStorage.setItem('sessao', JSON.stringify(nova));
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
