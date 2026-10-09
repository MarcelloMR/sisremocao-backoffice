// Fluxo de status da remoção (ver migração 0024 no backend). Sequência linear — a remoção avança
// um passo por vez a partir de Em_Processamento; Solicitada só é deixada via finalizar-alocacao
// (ambulância + equipe definidas). Cancelada é um estado terminal à parte, fora da sequência.
export const SEQUENCIA_STATUS_REMOCAO = [
  'Solicitada',
  'Em_Processamento',
  'Aceita',
  'Equipe_Em_Deslocamento',
  'Em_Execucao',
  'Concluida',
  'Aguardando_Pagamento',
  'Paga',
];

export const STATUS_REMOCAO_ROTULOS = {
  Solicitada: 'Solicitada',
  Em_Processamento: 'Em processamento',
  Aceita: 'Aceita',
  Equipe_Em_Deslocamento: 'Equipe em deslocamento',
  Em_Execucao: 'Em execução',
  Concluida: 'Concluída',
  Aguardando_Pagamento: 'Aguardando pagamento',
  Paga: 'Paga',
  Cancelada: 'Cancelada',
};

// A partir daqui (inclusive) a remoção não pode mais ser cancelada — espelha
// STATUS_SEM_CANCELAMENTO em services/entidades/remocao.js no backend.
export const STATUS_SEM_CANCELAMENTO = ['Equipe_Em_Deslocamento', 'Em_Execucao', 'Concluida', 'Aguardando_Pagamento', 'Paga', 'Cancelada'];

export const TODOS_STATUS_REMOCAO = [...SEQUENCIA_STATUS_REMOCAO, 'Cancelada'];

export function rotuloStatus(status) {
  return STATUS_REMOCAO_ROTULOS[status] || status;
}
