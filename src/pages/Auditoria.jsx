import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, CAMPO_CLASSES } from '../components/CampoFormulario.jsx';
import { ResultadoAuditoria } from '../components/ResultadoAuditoria.jsx';
import { descreverRegistro, descreverResultado, formatarDataHora, rotuloEntidade } from '../components/auditoriaFormato.js';

const OPCOES_POR_PAGINA = [20, 50];
const POR_PAGINA_PADRAO = 20;
const POR_PAGINA_EXPORTACAO = 200;
const MAXIMO_EXPORTACAO = 10000;

const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7d', rotulo: 'Últimos 7 dias' },
  { valor: '30d', rotulo: 'Últimos 30 dias' },
  { valor: 'tudo', rotulo: 'Tudo (6 meses)' },
  { valor: 'personalizado', rotulo: 'Personalizado' },
];

const FILTROS_PADRAO = { periodo: '7d', de: '', ate: '', email: '', acao: '', sucesso: '', entidade: '', entidadeCodigo: '' };

function inicioDoDia(data) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

// Traduz o período escolhido nos limites que a API espera. Datas digitadas valem pelo dia inteiro,
// no horário de quem está usando a tela.
function limitesDoPeriodo(filtros) {
  const hoje = inicioDoDia(new Date());
  if (filtros.periodo === 'hoje') {
    return { de: hoje.toISOString() };
  }
  if (filtros.periodo === '7d' || filtros.periodo === '30d') {
    const dias = filtros.periodo === '7d' ? 7 : 30;
    return { de: new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000).toISOString() };
  }
  if (filtros.periodo === 'personalizado') {
    const limites = {};
    if (filtros.de) {
      limites.de = new Date(`${filtros.de}T00:00:00`).toISOString();
    }
    if (filtros.ate) {
      limites.ate = new Date(`${filtros.ate}T23:59:59.999`).toISOString();
    }
    return limites;
  }
  return {};
}

function montarConsulta(filtros, pagina, limite) {
  const parametros = new URLSearchParams({ pagina: String(pagina), limite: String(limite), ...limitesDoPeriodo(filtros) });
  for (const campo of ['email', 'acao', 'sucesso', 'entidade', 'entidadeCodigo']) {
    if (filtros[campo]) {
      parametros.set(campo, filtros[campo]);
    }
  }
  return `/auditoria?${parametros.toString()}`;
}

// Só os filtros que fogem do padrão vão para a URL — assim o endereço fica curto e dá para
// compartilhar ou recarregar uma consulta (e as telas de detalhe conseguem apontar para cá).
function parametrosParaUrl(filtros, porPagina) {
  const parametros = {};
  for (const [campo, valor] of Object.entries(filtros)) {
    if (valor && valor !== FILTROS_PADRAO[campo]) {
      parametros[campo] = valor;
    }
  }
  if (porPagina !== POR_PAGINA_PADRAO) {
    parametros.linhas = String(porPagina);
  }
  return parametros;
}

function celulaCsv(valor) {
  const texto = valor == null ? '' : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

function baixarCsv(itens) {
  const cabecalho = ['Data e hora', 'Usuário', 'Papéis', 'Ação', 'Tipo de registro', 'Nº do registro', 'Resultado', 'Status HTTP', 'IP', 'Navegador', 'Método', 'Rota'];
  const linhas = itens.map((item) => [
    formatarDataHora(item.ocorridoEm),
    item.usuario.email,
    (item.usuario.papeis || []).join(', '),
    item.descricao,
    item.entidade ? rotuloEntidade(item.entidade) : '',
    item.entidadeCodigo,
    item.sucesso ? 'Sucesso' : 'Recusado',
    item.statusHttp,
    item.ip,
    item.userAgent,
    item.metodo,
    item.rota,
  ]);
  // Ponto e vírgula + BOM: é como o Excel em português abre um CSV com acentos sem embaralhar colunas.
  const conteudo = '﻿' + [cabecalho, ...linhas].map((linha) => linha.map(celulaCsv).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Detalhe({ rotulo, valor }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold uppercase tracking-wide text-text-secundario">{rotulo}</span>
      <span className="break-all text-sm font-medium text-text-principal">{valor ?? '—'}</span>
    </div>
  );
}

// Controles de página, repetidos acima e abaixo da tabela (quem rolou até o fim não precisa voltar
// ao topo para avançar). `idSeletor` distingue os dois seletores de "linhas por página" para o rótulo.
function Paginacao({ idSeletor, pagina, totalPaginas, total, porPagina, carregando, aoMudarPagina, aoMudarPorPagina }) {
  const primeiro = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-text-principal">
      <label htmlFor={idSeletor} className="flex items-center gap-2">
        Linhas por página
        <select
          id={idSeletor}
          value={porPagina}
          onChange={(evento) => aoMudarPorPagina(Number(evento.target.value))}
          className={`${CAMPO_CLASSES} py-1.5`}
        >
          {OPCOES_POR_PAGINA.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </label>

      <span className="tabular-nums text-text-secundario">
        {primeiro.toLocaleString('pt-BR')}–{ultimo.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => aoMudarPagina(pagina - 1)}
          disabled={pagina <= 1 || carregando}
          className="flex items-center gap-1 rounded-lg border border-text-secundario/30 px-3 py-1.5 transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </button>
        <span className="tabular-nums">
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={() => aoMudarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas || carregando}
          className="flex items-center gap-1 rounded-lg border border-text-secundario/30 px-3 py-1.5 transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// Tela de consulta da trilha de auditoria (só Admin). Só leitura: não há como alterar ou apagar um
// registro por aqui — a única saída de dados é a exportação do que foi filtrado.
export function Auditoria() {
  const { sessao } = useAuth();
  const [parametrosUrl, setParametrosUrl] = useSearchParams();
  const filtrosIniciais = { ...FILTROS_PADRAO, ...Object.fromEntries([...parametrosUrl].filter(([campo]) => campo in FILTROS_PADRAO)) };

  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [aplicados, setAplicados] = useState(filtrosIniciais);
  const [pagina, setPagina] = useState(1);
  const linhasNaUrl = Number(parametrosUrl.get('linhas'));
  const [porPagina, setPorPagina] = useState(OPCOES_POR_PAGINA.includes(linhasNaUrl) ? linhasNaUrl : POR_PAGINA_PADRAO);
  const [acoes, setAcoes] = useState([]);
  const [resposta, setResposta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    requisitar('/auditoria/acoes', { token: sessao.token })
      .then(setAcoes)
      .catch((excecao) => setErro(excecao.cause || excecao.message));
  }, [sessao.token]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    requisitar(montarConsulta(aplicados, pagina, porPagina), { token: sessao.token })
      .then((dados) => {
        if (!cancelado) {
          setResposta(dados);
          setAberto(null);
        }
      })
      .catch((excecao) => {
        if (!cancelado) {
          setErro(excecao.cause || excecao.message);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [aplicados, pagina, porPagina, sessao.token]);

  function aplicar(novosFiltros) {
    setFiltros(novosFiltros);
    setAplicados(novosFiltros);
    setPagina(1);
    setAviso(null);
    setParametrosUrl(parametrosParaUrl(novosFiltros, porPagina), { replace: true });
  }

  // Trocar o tamanho da página volta para a primeira: a posição antiga deixa de fazer sentido.
  function mudarPorPagina(novoTamanho) {
    setPorPagina(novoTamanho);
    setPagina(1);
    setParametrosUrl(parametrosParaUrl(aplicados, novoTamanho), { replace: true });
  }

  function atualizarCampo(campo) {
    return (evento) => setFiltros((atuais) => ({ ...atuais, [campo]: evento.target.value }));
  }

  async function exportar() {
    setExportando(true);
    setErro(null);
    setAviso(null);
    try {
      const itens = [];
      let total = Infinity;
      for (let paginaExportada = 1; itens.length < Math.min(total, MAXIMO_EXPORTACAO); paginaExportada += 1) {
        const dados = await requisitar(montarConsulta(aplicados, paginaExportada, POR_PAGINA_EXPORTACAO), { token: sessao.token });
        total = dados.total;
        itens.push(...dados.itens);
        if (dados.itens.length === 0) {
          break;
        }
      }
      baixarCsv(itens.slice(0, MAXIMO_EXPORTACAO));
      if (total > MAXIMO_EXPORTACAO) {
        setAviso(`A exportação foi limitada aos ${MAXIMO_EXPORTACAO.toLocaleString('pt-BR')} registros mais recentes, de ${total.toLocaleString('pt-BR')}. Reduza o período para exportar o restante.`);
      }
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setExportando(false);
    }
  }

  const total = resposta?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginacao = { pagina, totalPaginas, total, porPagina, carregando, aoMudarPagina: setPagina, aoMudarPorPagina: mudarPorPagina };
  const entidades = [...new Set(acoes.map((acao) => acao.entidade).filter(Boolean))].sort((a, b) =>
    rotuloEntidade(a).localeCompare(rotuloEntidade(b), 'pt-BR')
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Auditoria</h1>
        <p className="mt-1 text-sm text-text-secundario">
          Registro das ações de cadastro, alteração e remoção feitas no sistema, incluindo as tentativas recusadas. Guardado por 6 meses;
          consultas não são registradas.
        </p>
      </div>

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          aplicar(filtros);
        }}
        className="flex flex-col gap-4 rounded-xl bg-bg-card p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo rotulo="Período">
            <select value={filtros.periodo} onChange={atualizarCampo('periodo')} className={CAMPO_CLASSES}>
              {PERIODOS.map((periodo) => (
                <option key={periodo.valor} value={periodo.valor}>
                  {periodo.rotulo}
                </option>
              ))}
            </select>
          </Campo>

          {filtros.periodo === 'personalizado' && (
            <>
              <Campo rotulo="De">
                <input type="date" value={filtros.de} onChange={atualizarCampo('de')} className={CAMPO_CLASSES} />
              </Campo>
              <Campo rotulo="Até">
                <input type="date" value={filtros.ate} min={filtros.de || undefined} onChange={atualizarCampo('ate')} className={CAMPO_CLASSES} />
              </Campo>
            </>
          )}

          <Campo rotulo="Usuário (e-mail)">
            <input value={filtros.email} onChange={atualizarCampo('email')} placeholder="Parte do e-mail" className={CAMPO_CLASSES} />
          </Campo>

          <Campo rotulo="Ação">
            <select value={filtros.acao} onChange={atualizarCampo('acao')} className={CAMPO_CLASSES}>
              <option value="">Todas</option>
              {acoes.map((acao) => (
                <option key={acao.acao} value={acao.acao}>
                  {acao.descricao}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Resultado">
            <select value={filtros.sucesso} onChange={atualizarCampo('sucesso')} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              <option value="true">Sucesso</option>
              <option value="false">Recusado</option>
            </select>
          </Campo>

          <Campo rotulo="Tipo de registro">
            <select value={filtros.entidade} onChange={atualizarCampo('entidade')} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              {entidades.map((entidade) => (
                <option key={entidade} value={entidade}>
                  {rotuloEntidade(entidade)}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Nº do registro">
            <input
              value={filtros.entidadeCodigo}
              onChange={atualizarCampo('entidadeCodigo')}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ex: 12"
              className={CAMPO_CLASSES}
            />
          </Campo>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => aplicar(FILTROS_PADRAO)}
            className="rounded-lg border border-text-secundario/30 px-5 py-2 text-sm font-semibold text-text-principal transition-colors hover:bg-bg-app"
          >
            Limpar
          </button>
          <button type="submit" className="rounded-lg bg-chumbo px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90">
            Buscar
          </button>
        </div>
      </form>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {aviso && <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">{aviso}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-secundario" aria-live="polite">
          {carregando ? 'Carregando...' : `${total.toLocaleString('pt-BR')} ${total === 1 ? 'registro' : 'registros'}`}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={exportar}
            disabled={exportando || total === 0}
            className="flex items-center gap-2 rounded-lg border border-text-secundario/30 px-4 py-2 text-sm font-semibold text-text-principal transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>

          <Paginacao idSeletor="linhas-por-pagina-topo" {...paginacao} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-bg-card shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-azul-petroleo text-left text-white">
              <th className="px-5 py-3 font-bold">Data e hora</th>
              <th className="px-5 py-3 font-bold">Usuário</th>
              <th className="px-5 py-3 font-bold">Ação</th>
              <th className="px-5 py-3 font-bold">Registro</th>
              <th className="px-5 py-3 font-bold">Resultado</th>
              <th className="px-5 py-3">
                <span className="sr-only">Detalhes</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!carregando && resposta?.itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm font-medium text-text-secundario">
                  Nenhum registro encontrado com esses filtros.
                </td>
              </tr>
            )}
            {resposta?.itens.map((item) => (
              <Fragment key={item.codigo}>
                <tr className="border-t border-text-secundario/10 align-top">
                  <td className="px-5 py-3 whitespace-nowrap tabular-nums text-text-principal">{formatarDataHora(item.ocorridoEm)}</td>
                  <td className="px-5 py-3">
                    {item.usuario.email ? (
                      <button
                        type="button"
                        onClick={() => aplicar({ ...aplicados, email: item.usuario.email })}
                        title="Ver tudo o que este usuário fez"
                        className="text-left font-medium text-azul-petroleo hover:underline"
                      >
                        {item.usuario.email}
                      </button>
                    ) : (
                      <span className="text-text-secundario">—</span>
                    )}
                    {item.usuario.papeis?.length > 0 && <div className="text-xs text-text-secundario">{item.usuario.papeis.join(', ')}</div>}
                  </td>
                  <td className="px-5 py-3 font-medium text-text-principal">{item.descricao}</td>
                  <td className="px-5 py-3">
                    {item.entidade && item.entidadeCodigo != null ? (
                      <button
                        type="button"
                        onClick={() => aplicar({ ...aplicados, entidade: item.entidade, entidadeCodigo: String(item.entidadeCodigo) })}
                        title="Ver tudo o que aconteceu com este registro"
                        className="text-left font-medium text-azul-petroleo hover:underline"
                      >
                        {descreverRegistro(item)}
                      </button>
                    ) : (
                      <span className="text-text-secundario">{descreverRegistro(item)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <ResultadoAuditoria item={item} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setAberto(aberto === item.codigo ? null : item.codigo)}
                      aria-expanded={aberto === item.codigo}
                      aria-label={`${aberto === item.codigo ? 'Ocultar' : 'Mostrar'} detalhes: ${item.descricao}, ${formatarDataHora(item.ocorridoEm)}`}
                      className="rounded-lg p-1.5 text-text-secundario transition-colors hover:bg-bg-app hover:text-text-principal"
                    >
                      <ChevronDown className={`size-4 transition-transform ${aberto === item.codigo ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
                {aberto === item.codigo && (
                  <tr className="bg-bg-app/60">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Detalhe rotulo="Resultado" valor={descreverResultado(item)} />
                        <Detalhe rotulo="Endereço IP" valor={item.ip} />
                        <Detalhe rotulo="Chamada" valor={`${item.metodo} ${item.rota}`} />
                        <Detalhe rotulo="Nº do registro de auditoria" valor={item.codigo} />
                        <div className="sm:col-span-2 lg:col-span-4">
                          <Detalhe rotulo="Navegador" valor={item.userAgent} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex justify-end">
          <Paginacao idSeletor="linhas-por-pagina-rodape" {...paginacao} />
        </div>
      )}
    </div>
  );
}
