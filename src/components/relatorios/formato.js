// Formatação, períodos e exportação compartilhados pelas abas de Relatórios.
import { requisitar } from '../../api/client.js';

const NUMERO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const DATA_HORA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function formatarNumero(valor) {
  return valor === null || valor === undefined ? '—' : NUMERO.format(valor);
}

// Sem o dado (remoção antiga, sem horário ou odômetro) aparece "—": nunca um valor inventado.
export function formatarDuracao(minutos) {
  if (minutos === null || minutos === undefined) {
    return '—';
  }
  return `${Math.floor(minutos / 60)}h${String(Math.round(minutos % 60)).padStart(2, '0')}`;
}

export function formatarDataHora(iso) {
  return iso ? DATA_HORA.format(new Date(iso)).replace(',', '') : '—';
}

export function rotuloAmbulancia(ambulancia) {
  if (!ambulancia) {
    return '—';
  }
  return [ambulancia.numero != null ? `Nº ${ambulancia.numero}` : null, ambulancia.placa].filter(Boolean).join(' · ') || '—';
}

function inicioDoDia(data) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

// Limites [de, até) de cada atalho, no horário de quem está usando a tela.
export function limitesDoPeriodo({ atalho, de, ate }) {
  const hoje = inicioDoDia(new Date());
  if (atalho === 'hoje') {
    return { de: hoje, ate: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1) };
  }
  if (atalho === 'semana') {
    // Semana de segunda a domingo.
    const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() + 6) % 7));
    return { de: segunda, ate: new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + 7) };
  }
  if (atalho === 'personalizado' && de && ate) {
    const fim = new Date(`${ate}T00:00:00`);
    return { de: new Date(`${de}T00:00:00`), ate: new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() + 1) };
  }
  return { de: new Date(hoje.getFullYear(), hoje.getMonth(), 1), ate: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1) };
}

// Parâmetros de consulta comuns às rotas de relatório.
export function montarParametros(limites, filtros, extras = {}) {
  const parametros = new URLSearchParams();
  if (limites) {
    parametros.set('de', limites.de.toISOString());
    parametros.set('ate', limites.ate.toISOString());
  }
  for (const campo of ['cliente', 'ambulancia', 'profissional', 'tipo']) {
    if (filtros[campo]) {
      parametros.set(campo, filtros[campo]);
    }
  }
  for (const [campo, valor] of Object.entries(extras)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      parametros.set(campo, valor);
    }
  }
  return parametros.toString();
}

// Cache em memória, só durante a sessão: voltar a uma aba ou repetir um filtro não consulta a API de
// novo. Dura 60 segundos, para os números não ficarem velhos numa tela aberta o dia todo.
const cache = new Map();
const VALIDADE_CACHE_MS = 60 * 1000;

export function consultarComCache(caminho, token) {
  const guardado = cache.get(caminho);
  if (guardado && Date.now() - guardado.em < VALIDADE_CACHE_MS) {
    return guardado.promessa;
  }
  const promessa = requisitar(caminho, { token }).catch((excecao) => {
    cache.delete(caminho);
    throw excecao;
  });
  cache.set(caminho, { em: Date.now(), promessa });
  return promessa;
}

// ---- CSV: ";" como separador, vírgula decimal e BOM — é como o Excel em português abre sem ajuste.
function celulaCsv(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }
  const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export function baixarCsv(nomeArquivo, cabecalho, linhas) {
  const conteudo = '﻿' + [cabecalho, ...linhas].map((linha) => linha.map(celulaCsv).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export function paraNomeDeArquivo(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
