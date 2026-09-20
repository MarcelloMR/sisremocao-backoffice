import { Component } from 'react';

// Qualquer erro de renderização não tratado (ex: sessão salva num formato antigo, incompatível
// após uma mudança no backend) não deve deixar a UI em branco — limpa a sessão local e manda pro
// login, de onde o usuário consegue continuar normalmente.
export class ErrorBoundary extends Component {
  state = { comErro: false };

  static getDerivedStateFromError() {
    return { comErro: true };
  }

  componentDidCatch(erro) {
    console.error('[ErrorBoundary] Erro não tratado, redirecionando para o login:', erro);
    try {
      localStorage.removeItem('sessao');
    } catch {
      // localStorage pode não estar disponível (ex: modo privado) — segue para o redirect mesmo assim
    }
    window.location.href = '/login';
  }

  render() {
    if (this.state.comErro) {
      return null;
    }
    return this.props.children;
  }
}
