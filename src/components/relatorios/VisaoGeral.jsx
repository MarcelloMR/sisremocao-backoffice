import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Minus, TriangleAlert } from 'lucide-react';
import { requisitar } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Campo, CAMPO_CLASSES } from '../CampoFormulario.jsx';
import { rotuloStatus } from '../../constants/statusRemocao.js';
import {
  baixarCsv,
  consultarComCache,
  formatarDataHora,
  formatarDuracao,
  formatarNumero,
  limitesDoPeriodo,
  montarParametros,
  paraNomeDeArquivo,
  rotuloAmbulancia,
} from './formato.js';

const ATALHOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'personalizado', rotulo: 'Personalizado' },
];
const FILTROS_PADRAO = { atalho: 'mes', de: '', ate: '', cliente: '', ambulancia: '', profissional: '', tipo: '' };
const POR_PAGINA = 20;
const ATUALIZAR_AGORA_A_CADA_MS = 60 * 1000;

// Cores das duas séries do gráfico: par validado para contraste e para daltonismo. O texto nunca usa
// a cor da série — quem identifica é a legenda e o rótulo.
const COR_SOLICITACOES = '#2a78d6';
const COR_REALIZADAS = '#eb6834';

function Cartao({ titulo, children, acoes }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">{titulo}</h2>
        {acoes}
      </div>
      {children}
    </section>
  );
}

// Variação contra o período anterior equivalente. `emPontos`: diferença em pontos percentuais (taxas);
// caso contrário, variação relativa. `menorEhMelhor` inverte o sentido (tempo médio).
function Variacao({ atual, anterior, emPontos = false, menorEhMelhor = false }) {
  if (atual === null || atual === undefined || anterior === null || anterior === undefined || (!emPontos && anterior === 0)) {
    return <span className="text-xs text-text-secundario">sem base de comparação</span>;
  }
  const diferenca = emPontos ? atual - anterior : ((atual - anterior) / anterior) * 100;
  const arredondada = Math.round(diferenca * 10) / 10;
  const Icone = arredondada > 0 ? ArrowUpRight : arredondada < 0 ? ArrowDownRight : Minus;
  const melhorou = menorEhMelhor ? arredondada < 0 : arredondada > 0;
  const cor = arredondada === 0 ? 'text-text-secundario' : melhorou ? 'text-azul-petroleo' : 'text-vermelho';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cor}`}>
      <Icone className="size-3.5" aria-hidden="true" />
      {arredondada > 0 ? '+' : ''}
      {formatarNumero(arredondada)}
      {emPontos ? ' p.p.' : '%'}
      <span className="font-normal text-text-secundario">vs. período anterior</span>
    </span>
  );
}

function Indicador({ rotulo, valor, detalhe, variacao }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl bg-bg-card p-4 shadow-sm sm:p-5">
      <span className="text-xs font-bold uppercase tracking-wide text-text-secundario">{rotulo}</span>
      <span className="text-2xl font-bold tabular-nums text-chumbo sm:text-3xl">{valor}</span>
      {detalhe && <span className="text-sm text-text-secundario">{detalhe}</span>}
      {variacao}
    </div>
  );
}

function rotuloDoPonto(inicio, agrupamento) {
  const data = new Date(`${inicio}T12:00:00`);
  return agrupamento === 'mes'
    ? data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de ', '/').replace('.', '')
    : data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Barras agrupadas em CSS: duas séries, um eixo só. Cada grupo tem título para leitura por toque ou
// mouse, e os mesmos números aparecem na tabela de dados logo abaixo (acessível a leitor de tela).
function GraficoSerie({ pontos, agrupamento }) {
  const maximo = Math.max(1, ...pontos.map((ponto) => ponto.solicitacoes));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-principal">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: COR_SOLICITACOES }} aria-hidden="true" />
          Solicitações
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: COR_REALIZADAS }} aria-hidden="true" />
          Realizadas
        </span>
      </div>

      <div className="flex h-48 items-end gap-2 border-b border-text-secundario/25 sm:gap-4" aria-hidden="true">
        {pontos.map((ponto) => (
          <div
            key={ponto.inicio}
            className="group flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
            title={`${agrupamento === 'mes' ? 'Mês' : 'Semana de'} ${rotuloDoPonto(ponto.inicio, agrupamento)}: ${ponto.solicitacoes} solicitações, ${ponto.realizadas} realizadas`}
          >
            <div className="w-full max-w-7 rounded-t" style={{ height: `${(ponto.solicitacoes / maximo) * 100}%`, minHeight: ponto.solicitacoes ? 2 : 0, background: COR_SOLICITACOES }} />
            <div className="w-full max-w-7 rounded-t" style={{ height: `${(ponto.realizadas / maximo) * 100}%`, minHeight: ponto.realizadas ? 2 : 0, background: COR_REALIZADAS }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-4" aria-hidden="true">
        {pontos.map((ponto) => (
          <div key={ponto.inicio} className="min-w-0 flex-1 text-center">
            <div className="truncate text-xs text-text-secundario">{rotuloDoPonto(ponto.inicio, agrupamento)}</div>
            <div className="text-xs font-semibold tabular-nums text-text-principal">
              {ponto.solicitacoes}/{ponto.realizadas}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-secundario">Abaixo de cada período: solicitações / realizadas.</p>

      <table className="sr-only">
        <caption>Solicitações e realizadas por {agrupamento === 'mes' ? 'mês' : 'semana'}</caption>
        <thead>
          <tr>
            <th>Período</th>
            <th>Solicitações</th>
            <th>Realizadas</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((ponto) => (
            <tr key={ponto.inicio}>
              <td>{rotuloDoPonto(ponto.inicio, agrupamento)}</td>
              <td>{ponto.solicitacoes}</td>
              <td>{ponto.realizadas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarraHorizontal({ proporcao, alerta = false }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-app" aria-hidden="true">
      <div className={`h-full rounded-full ${alerta ? 'bg-vermelho' : 'bg-azul-petroleo'}`} style={{ width: `${Math.max(2, proporcao * 100)}%` }} />
    </div>
  );
}

export function VisaoGeral() {
  const { sessao } = useAuth();
  const token = sessao.token;
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [agrupamento, setAgrupamento] = useState('semana');
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [pagina, setPagina] = useState(1);
  const [opcoes, setOpcoes] = useState({ clientes: [], ambulancias: [], profissionais: [] });
  const [dados, setDados] = useState(null);
  const [serie, setSerie] = useState(null);
  const [agora, setAgora] = useState(null);
  const [tabela, setTabela] = useState(null);
  const [erro, setErro] = useState(null);
  const [exportando, setExportando] = useState(false);

  // Personalizado só vale com as duas datas; até lá a tela segue com o mês corrente.
  const periodoValido = filtros.atalho !== 'personalizado' || (filtros.de && filtros.ate && filtros.de <= filtros.ate);
  const limites = useMemo(
    () => limitesDoPeriodo(periodoValido ? filtros : { atalho: 'mes' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtros.atalho, filtros.de, filtros.ate, periodoValido]
  );
  const parametrosDoPeriodo = montarParametros(limites, filtros);
  const parametrosDaSerie = montarParametros(null, filtros, { agrupamento });
  const parametrosDaTabela = montarParametros(limites, filtros, { busca: buscaAplicada, pagina, limite: POR_PAGINA });

  useEffect(() => {
    Promise.all([
      consultarComCache('/cliente', token),
      consultarComCache('/ambulancia?incluirInativos=true', token),
      consultarComCache('/profissional?incluirInativos=true', token),
    ])
      .then(([clientes, ambulancias, profissionais]) => setOpcoes({ clientes, ambulancias, profissionais }))
      .catch((excecao) => setErro(excecao.cause || excecao.message));
  }, [token]);

  useEffect(() => {
    setErro(null);
    consultarComCache(`/relatorios/visao-geral?${parametrosDoPeriodo}`, token)
      .then(setDados)
      .catch((excecao) => setErro(excecao.cause || excecao.message));
  }, [parametrosDoPeriodo, token]);

  useEffect(() => {
    consultarComCache(`/relatorios/serie?${parametrosDaSerie}`, token)
      .then(setSerie)
      .catch((excecao) => setErro(excecao.cause || excecao.message));
  }, [parametrosDaSerie, token]);

  useEffect(() => {
    consultarComCache(`/relatorios/remocoes?${parametrosDaTabela}`, token)
      .then(setTabela)
      .catch((excecao) => setErro(excecao.cause || excecao.message));
  }, [parametrosDaTabela, token]);

  // "Agora" é o único bloco que se atualiza sozinho, e só enquanto a aba está visível.
  useEffect(() => {
    const carregar = () => {
      if (document.visibilityState === 'visible') {
        requisitar('/relatorios/agora', { token }).then(setAgora).catch(() => {});
      }
    };
    carregar();
    const temporizador = setInterval(carregar, ATUALIZAR_AGORA_A_CADA_MS);
    document.addEventListener('visibilitychange', carregar);
    return () => {
      clearInterval(temporizador);
      document.removeEventListener('visibilitychange', carregar);
    };
  }, [token]);

  function mudarFiltro(campo, valor) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    setPagina(1);
  }

  async function exportar() {
    setExportando(true);
    setErro(null);
    try {
      const itens = [];
      for (let paginaExportada = 1; ; paginaExportada += 1) {
        const lote = await requisitar(`/relatorios/remocoes?${montarParametros(limites, filtros, { busca: buscaAplicada, pagina: paginaExportada, limite: 200 })}`, { token });
        itens.push(...lote.itens);
        if (itens.length >= lote.total || lote.itens.length === 0) {
          break;
        }
      }
      const cliente = opcoes.clientes.find((item) => String(item.codigo) === String(filtros.cliente));
      const competencia = `${limites.de.getFullYear()}-${String(limites.de.getMonth() + 1).padStart(2, '0')}`;
      baixarCsv(
        `remocoes_${competencia}_${cliente ? paraNomeDeArquivo(cliente.nomeFantasia) : 'todos'}.csv`,
        ['Protocolo', 'Solicitada em', 'Cliente', 'Origem', 'Destino', 'Ambulância', 'Tipo', 'Equipe', 'Km', 'Duração (min)', 'Saída da base', 'Retorno à base', 'Status'],
        itens.map((item) => [
          item.codigo,
          formatarDataHora(item.solicitadaEm),
          item.cliente,
          item.origem,
          item.destino,
          item.ambulancia ? rotuloAmbulancia(item.ambulancia) : '',
          item.tipo,
          item.equipe,
          item.km,
          item.duracaoMin,
          item.saidaBaseEm ? formatarDataHora(item.saidaBaseEm) : '',
          item.retornoBaseEm ? formatarDataHora(item.retornoBaseEm) : '',
          rotuloStatus(item.status),
        ])
      );
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setExportando(false);
    }
  }

  const ind = dados?.indicadores;
  const ant = dados?.indicadoresAnteriores;
  const maiorRemocoes = Math.max(1, ...(dados?.topColaboradores || []).map((item) => item.remocoes));
  const maiorTempo = Math.max(dados?.metaTempoMin || 1, ...(dados?.tempoPorCliente || []).map((item) => item.tempoMedioMin));
  const totalPaginas = Math.max(1, Math.ceil((tabela?.total || 0) / POR_PAGINA));

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-xl bg-bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
            {ATALHOS.map((atalho) => (
              <button
                key={atalho.valor}
                type="button"
                onClick={() => mudarFiltro('atalho', atalho.valor)}
                aria-pressed={filtros.atalho === atalho.valor}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  filtros.atalho === atalho.valor ? 'bg-chumbo text-white' : 'border border-text-secundario/30 text-text-principal hover:bg-bg-app'
                }`}
              >
                {atalho.rotulo}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportar}
            disabled={exportando || !tabela?.total}
            className="flex items-center gap-2 rounded-lg border border-text-secundario/30 px-4 py-2 text-sm font-semibold text-text-principal transition-colors hover:bg-bg-app disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtros.atalho === 'personalizado' && (
            <>
              <Campo rotulo="De">
                <input type="date" value={filtros.de} onChange={(e) => mudarFiltro('de', e.target.value)} className={CAMPO_CLASSES} />
              </Campo>
              <Campo rotulo="Até">
                <input type="date" value={filtros.ate} min={filtros.de || undefined} onChange={(e) => mudarFiltro('ate', e.target.value)} className={CAMPO_CLASSES} />
              </Campo>
            </>
          )}
          <Campo rotulo="Cliente">
            <select value={filtros.cliente} onChange={(e) => mudarFiltro('cliente', e.target.value)} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              {opcoes.clientes.map((cliente) => (
                <option key={cliente.codigo} value={cliente.codigo}>
                  {cliente.nomeFantasia}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Ambulância">
            <select value={filtros.ambulancia} onChange={(e) => mudarFiltro('ambulancia', e.target.value)} className={CAMPO_CLASSES}>
              <option value="">Todas</option>
              {opcoes.ambulancias.map((ambulancia) => (
                <option key={ambulancia.codigo} value={ambulancia.codigo}>
                  {rotuloAmbulancia({ numero: ambulancia.numeroIdentificacao, placa: ambulancia.placaIdentificador })}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Colaborador">
            <select value={filtros.profissional} onChange={(e) => mudarFiltro('profissional', e.target.value)} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              {opcoes.profissionais.map((profissional) => (
                <option key={profissional.codigo} value={profissional.codigo}>
                  {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Tipo de remoção">
            <select value={filtros.tipo} onChange={(e) => mudarFiltro('tipo', e.target.value)} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              <option value="Basica">Básica</option>
              <option value="UTI">UTI</option>
            </select>
          </Campo>
        </div>
        {!periodoValido && <p className="text-sm text-text-secundario">Informe as duas datas do período personalizado. Enquanto isso, a tela mostra o mês atual.</p>}
      </section>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <Indicador
          rotulo="Remoções realizadas"
          valor={ind ? formatarNumero(ind.realizadas) : '—'}
          variacao={ind && <Variacao atual={ind.realizadas} anterior={ant.realizadas} />}
        />
        <Indicador
          rotulo="Solicitações"
          valor={ind ? formatarNumero(ind.solicitacoes) : '—'}
          variacao={ind && <Variacao atual={ind.solicitacoes} anterior={ant.solicitacoes} />}
        />
        <Indicador
          rotulo="Taxa de atendimento"
          valor={ind?.taxaAtendimento != null ? `${formatarNumero(ind.taxaAtendimento)}%` : '—'}
          detalhe={ind ? `${ind.naoAtendidas} não atendidas${ind.recusadas ? `, ${ind.recusadas} por falta de ambulância ou equipe` : ''}` : null}
          variacao={ind && <Variacao atual={ind.taxaAtendimento} anterior={ant.taxaAtendimento} emPontos />}
        />
        <Indicador
          rotulo="Km rodados"
          valor={ind ? formatarNumero(ind.kmRodados) : '—'}
          detalhe={ind?.kmPorRemocao != null ? `${formatarNumero(ind.kmPorRemocao)} km por remoção` : 'Sem odômetro registrado no período'}
          variacao={ind && <Variacao atual={ind.kmRodados} anterior={ant.kmRodados} />}
        />
        <Indicador
          rotulo="Tempo médio de remoção"
          valor={formatarDuracao(ind?.tempoMedioMin)}
          detalhe={ind ? (ind.remocoesComTempo ? `Base a base, em ${ind.remocoesComTempo} remoções com horário` : 'Sem horários registrados no período') : null}
          variacao={ind && <Variacao atual={ind.tempoMedioMin} anterior={ant.tempoMedioMin} menorEhMelhor />}
        />
        <Indicador
          rotulo="Frota disponível agora"
          valor={dados ? `${dados.frota.disponiveis} / ${dados.frota.total}` : '—'}
          detalhe={dados ? `${dados.frota.paradas} ${dados.frota.paradas === 1 ? 'ambulância parada' : 'ambulâncias paradas'}` : null}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao
            titulo="Solicitações × realizadas"
            acoes={
              <div className="flex gap-2" role="group" aria-label="Agrupar por">
                {[
                  { valor: 'semana', rotulo: 'Últimas 8 semanas' },
                  { valor: 'mes', rotulo: 'Últimos 6 meses' },
                ].map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => setAgrupamento(opcao.valor)}
                    aria-pressed={agrupamento === opcao.valor}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                      agrupamento === opcao.valor ? 'bg-chumbo text-white' : 'border border-text-secundario/30 text-text-principal hover:bg-bg-app'
                    }`}
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>
            }
          >
            {serie ? <GraficoSerie pontos={serie.pontos} agrupamento={serie.agrupamento} /> : <p className="text-sm text-text-secundario">Carregando...</p>}
            <p className="text-xs text-text-secundario">Este gráfico segue os filtros de cliente, ambulância, colaborador e tipo, mas não o período selecionado.</p>
          </Cartao>
        </div>

        <Cartao titulo="Agora">
          {agora ? (
            <dl className="flex flex-col divide-y divide-text-secundario/10">
              {[
                ['Aguardando equipe', agora.aguardandoEquipe],
                ['Em deslocamento', agora.emDeslocamento],
                ['Em atendimento', agora.emAtendimento],
                ['Agendadas para amanhã', agora.agendadasAmanha],
                ['Canceladas no mês', agora.canceladasNoMes],
              ].map(([rotulo, valor]) => (
                <div key={rotulo} className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-sm text-text-principal">{rotulo}</dt>
                  <dd className="text-xl font-bold tabular-nums text-chumbo">{valor}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-text-secundario">Carregando...</p>
          )}
          {agora && <p className="text-xs text-text-secundario">Atualizado às {new Date(agora.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}; renova a cada minuto.</p>}
        </Cartao>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Cartao titulo="Top 5 colaboradores no período">
          {dados?.topColaboradores.length ? (
            <ul className="flex flex-col gap-4">
              {dados.topColaboradores.map((item) => (
                <li key={item.codigo} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-semibold text-text-principal">
                      {item.nome} <span className="font-normal text-text-secundario">· {item.funcao ? item.funcao.replace('_', ' ') : 'cadastro pendente'}</span>
                    </span>
                    <span className="text-sm tabular-nums text-text-principal">
                      {item.remocoes} {item.remocoes === 1 ? 'remoção' : 'remoções'} · {formatarNumero(item.km)} km
                    </span>
                  </div>
                  <BarraHorizontal proporcao={item.remocoes / maiorRemocoes} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secundario">{dados ? 'Nenhuma remoção realizada no período.' : 'Carregando...'}</p>
          )}
        </Cartao>

        <Cartao titulo="Tempo médio de remoção por cliente">
          {dados?.tempoPorCliente.length ? (
            <ul className="flex flex-col gap-4">
              {dados.tempoPorCliente.map((item) => (
                <li key={item.cliente} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-semibold text-text-principal">{item.cliente}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-text-principal">
                      {item.acimaDaMeta && (
                        <span className="inline-flex items-center gap-1 font-semibold text-vermelho">
                          <TriangleAlert className="size-4" aria-hidden="true" />
                          acima da meta
                        </span>
                      )}
                      {formatarDuracao(item.tempoMedioMin)} · {item.remocoes} {item.remocoes === 1 ? 'remoção' : 'remoções'}
                    </span>
                  </div>
                  <BarraHorizontal proporcao={item.tempoMedioMin / maiorTempo} alerta={item.acimaDaMeta} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secundario">{dados ? 'Nenhuma remoção com saída e retorno registrados no período.' : 'Carregando...'}</p>
          )}
          {dados && <p className="text-xs text-text-secundario">Meta: {formatarDuracao(dados.metaTempoMin)}, da saída ao retorno à base.</p>}
        </Cartao>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">Remoções do período</h2>
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              setBuscaAplicada(busca.trim());
              setPagina(1);
            }}
            className="flex w-full gap-2 sm:w-auto"
          >
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Protocolo, cliente, origem ou destino"
              aria-label="Buscar remoções"
              className={`${CAMPO_CLASSES} min-w-0 flex-1 sm:w-72`}
            />
            <button type="submit" className="rounded-lg bg-chumbo px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90">
              Buscar
            </button>
          </form>
        </div>

        <div className="tabela-cartoes-moldura overflow-x-auto rounded-xl bg-bg-card shadow-sm">
          <table className="tabela-cartoes w-full text-sm lg:min-w-[1080px]">
            <thead>
              <tr className="bg-azul-petroleo text-left text-white">
                <th className="px-4 py-3 font-bold">Protocolo</th>
                <th className="px-4 py-3 font-bold">Data</th>
                <th className="px-4 py-3 font-bold">Cliente</th>
                <th className="px-4 py-3 font-bold">Origem → destino</th>
                <th className="px-4 py-3 font-bold">Ambulância</th>
                <th className="px-4 py-3 font-bold">Equipe</th>
                <th className="px-4 py-3 text-right font-bold">Km</th>
                <th className="px-4 py-3 text-right font-bold">Duração</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {tabela && tabela.itens.length === 0 && (
                <tr className="linha-vazia">
                  <td colSpan={9} className="px-4 py-8 text-center text-sm font-medium text-text-secundario">
                    Nenhuma remoção no período com esses filtros.
                  </td>
                </tr>
              )}
              {tabela?.itens.map((item) => (
                <tr key={item.codigo} className="border-t border-text-secundario/10 align-top">
                  <td className="celula-titulo px-4 py-3 font-medium">
                    <Link to={`/remocoes/${item.codigo}`} className="text-azul-petroleo hover:underline">
                      #{item.codigo}
                    </Link>
                  </td>
                  <td data-rotulo="Data" className="px-4 py-3 whitespace-nowrap tabular-nums text-text-principal">{formatarDataHora(item.solicitadaEm)}</td>
                  <td data-rotulo="Cliente" className="px-4 py-3 text-text-principal">{item.cliente || '—'}</td>
                  <td data-rotulo="Origem → destino" className="px-4 py-3 text-text-secundario">
                    {item.origem || item.destino ? `${item.origem || '—'} → ${item.destino || '—'}` : '—'}
                  </td>
                  <td data-rotulo="Ambulância" className="px-4 py-3 text-text-secundario">{rotuloAmbulancia(item.ambulancia)}</td>
                  <td data-rotulo="Equipe" className="px-4 py-3 text-text-secundario">{item.equipe || '—'}</td>
                  <td data-rotulo="Km" className="px-4 py-3 text-right tabular-nums text-text-principal">{formatarNumero(item.km)}</td>
                  <td data-rotulo="Duração" className="px-4 py-3 text-right tabular-nums text-text-principal">{formatarDuracao(item.duracaoMin)}</td>
                  <td data-rotulo="Status" className="px-4 py-3 text-text-principal">{rotuloStatus(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tabela && tabela.total > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm font-medium text-text-principal">
            <span className="tabular-nums text-text-secundario">
              {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, tabela.total)} de {tabela.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina(pagina - 1)}
                disabled={pagina <= 1}
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
                onClick={() => setPagina(pagina + 1)}
                disabled={pagina >= totalPaginas}
                className="flex items-center gap-1 rounded-lg border border-text-secundario/30 px-3 py-1.5 transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
