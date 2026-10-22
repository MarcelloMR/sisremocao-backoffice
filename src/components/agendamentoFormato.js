// Agendamento de remoção: conversão entre o <input type="datetime-local"> (sem fuso, no horário do
// navegador) e o ISO 8601 com fuso que a API grava (TIMESTAMPTZ).

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

// ISO da API -> valor do campo ("2026-10-22T14:30"), no horário local do navegador.
export function paraCampoDataHora(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

// Valor do campo -> ISO com fuso; vazio vira null (limpa o horário).
export function deCampoDataHora(valor) {
  return valor ? new Date(valor).toISOString() : null;
}

export function agoraParaCampo() {
  return paraCampoDataHora(new Date().toISOString());
}

export function formatarAgendamento(iso) {
  return iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null;
}
