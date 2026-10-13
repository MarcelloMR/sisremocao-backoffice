// Formatação compartilhada entre a tela de Auditoria e o bloco "Histórico de ações" das telas de detalhe.

export const ROTULO_ENTIDADE = {
  remocao: 'Remoção',
  ambulancia: 'Ambulância',
  profissional: 'Profissional',
  cliente: 'Cliente',
  vaga: 'Vaga',
  usuario: 'Usuário',
  carro: 'Veículo',
  seguro: 'Seguro',
  endereco: 'Endereço',
  auditoria: 'Auditoria',
};

const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Sempre no fuso de Brasília e com segundos: numa trilha de auditoria a ordem dos eventos importa.
export function formatarDataHora(iso) {
  return iso ? FORMATO_DATA_HORA.format(new Date(iso)).replace(',', '') : '—';
}

export function rotuloEntidade(entidade) {
  return ROTULO_ENTIDADE[entidade] || entidade || '—';
}

export function descreverRegistro(item) {
  if (!item.entidade) {
    return '—';
  }
  return item.entidadeCodigo != null ? `${rotuloEntidade(item.entidade)} nº ${item.entidadeCodigo}` : rotuloEntidade(item.entidade);
}

export function descreverResultado(item) {
  return item.sucesso ? 'Sucesso' : `Recusado (${item.statusHttp})`;
}
