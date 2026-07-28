import { createContext, useContext, useState, useCallback } from 'react';
import { requisitar } from '../api/client.js';

const AuthContext = createContext(null);

function lerSessaoSalva() {
  const bruto = localStorage.getItem('sessao');
  return bruto ? JSON.parse(bruto) : null;
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
