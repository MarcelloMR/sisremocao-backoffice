import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RastreadorStatusRemocao } from '../components/RastreadorStatusRemocao.jsx';
import {
  MOTIVOS_CANCELAMENTO,
  STATUS_COM_RETORNO_BASE,
  STATUS_SEM_CANCELAMENTO,
  rotuloMotivoCancelamento,
  rotuloStatus,
} from '../constants/statusRemocao.js';
import { Campo, CAMPO_CLASSES } from '../components/CampoFormulario.jsx';
import { HistoricoAcoes } from '../components/HistoricoAcoes.jsx';
import { deCampoDataHora, formatarAgendamento, paraCampoDataHora } from '../components/agendamentoFormato.js';

// Até a equipe sair da base, a regulação ainda pode combinar ou ajustar os horários.
const STATUS_COM_AGENDAMENTO_EDITAVEL = ['Solicitada', 'Em_Processamento', 'Aceita'];

// Aceitar uma remoção agendada é definir a hora em que a equipe estará na origem; o cliente pode ter
// pedido só a chegada no destino. Recusar é o "Cancelar remoção" com motivo Sem viatura/Sem equipe.
function FormularioAgendamento({ remocao, token, aoSalvar }) {
  const [chegadaOrigem, setChegadaOrigem] = useState(paraCampoDataHora(remocao.chegadaOrigemPrevista));
  const [chegadaDestino, setChegadaDestino] = useState(paraCampoDataHora(remocao.chegadaDestinoDesejada));
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await requisitar(`/remocao/${remocao.codigo}`, {
        method: 'PUT',
        token,
        body: { chegadaOrigemPrevista: deCampoDataHora(chegadaOrigem), chegadaDestinoDesejada: deCampoDataHora(chegadaDestino) },
      });
      aoSalvar();
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="flex flex-col gap-4 border-t border-text-secundario/15 pt-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo rotulo="Chegada prevista na origem" obrigatorio={Boolean(chegadaDestino)}>
          <input
            type="datetime-local"
            value={chegadaOrigem}
            max={chegadaDestino || undefined}
            onChange={(e) => setChegadaOrigem(e.target.value)}
            required={Boolean(chegadaDestino)}
            className={CAMPO_CLASSES}
          />
        </Campo>
        <Campo rotulo="Chegada no destino">
          <input
            type="datetime-local"
            value={chegadaDestino}
            min={chegadaOrigem || undefined}
            onChange={(e) => setChegadaDestino(e.target.value)}
            className={CAMPO_CLASSES}
          />
        </Campo>
      </div>
      <p className="text-xs text-text-secundario">
        A equipe escalada recebe um lembrete por e-mail 1 hora antes de cada horário. Mudar um horário já lembrado gera um novo
        lembrete.
      </p>
      {erro && <p className="text-sm font-medium text-vermelho">{erro}</p>}
      <button
        type="submit"
        disabled={salvando}
        className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {salvando ? 'Salvando...' : 'Salvar horários'}
      </button>
    </form>
  );
}

function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold uppercase tracking-wide text-text-secundario">{rotulo}</span>
      <span className="text-sm font-medium text-text-principal">{valor ?? '—'}</span>
    </div>
  );
}

function formatarHorario(iso) {
  return iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null;
}

// Duração do atendimento, da saída da base ao retorno. Sem um dos dois horários não há o que mostrar.
function formatarDuracao(inicio, fim) {
  if (!inicio || !fim) {
    return null;
  }
  const minutos = Math.round((new Date(fim) - new Date(inicio)) / 60000);
  return `${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, '0')}`;
}

function descreverLocal(local) {
  if (!local) return '—';
  if (local.hospital) return local.hospital.nome;
  if (local.endereco) return local.endereco.logradouro;
  return '—';
}

function FormularioValorCobrado({ codigo, valorAtual, token, aoSalvar }) {
  const [valor, setValor] = useState(valorAtual ?? '');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const resposta = await requisitar(`/remocao/${codigo}/valor`, {
        method: 'PUT',
        token,
        body: { valorCobrado: Number(valor) },
      });
      aoSalvar(resposta.valorCobrado);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
        Valor cobrado (R$)
        <input
          type="number"
          step="0.01"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          className="rounded-lg border border-text-secundario/30 px-3 py-2 text-sm font-normal outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo"
        />
      </label>
      <button
        type="submit"
        disabled={salvando}
        className="rounded-lg bg-chumbo px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {salvando ? 'Salvando...' : 'Salvar valor'}
      </button>
      {erro && <p className="w-full text-sm font-medium text-vermelho">{erro}</p>}
    </form>
  );
}

export function DetalharRemocao() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [remocao, setRemocao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [erroFinalizar, setErroFinalizar] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [erroAvancar, setErroAvancar] = useState(null);
  const [avancando, setAvancando] = useState(false);
  const [erroCancelar, setErroCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [cancelamentoAberto, setCancelamentoAberto] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [observacaoCancelamento, setObservacaoCancelamento] = useState('');
  const [odometroInicial, setOdometroInicial] = useState('');
  const [odometroFinal, setOdometroFinal] = useState('');
  const [erroRetorno, setErroRetorno] = useState(null);
  const [registrandoRetorno, setRegistrandoRetorno] = useState(false);

  function recarregar() {
    requisitar(`/remocao/${codigo}`, { token: sessao.token })
      .then(setRemocao)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }

  useEffect(recarregar, [codigo, sessao.token]);

  async function finalizarAlocacao() {
    setErroFinalizar(null);
    setFinalizando(true);
    try {
      await requisitar(`/remocao/${codigo}/finalizar-alocacao`, { method: 'PUT', token: sessao.token });
      recarregar();
    } catch (excecao) {
      setErroFinalizar(excecao.cause || excecao.message);
    } finally {
      setFinalizando(false);
    }
  }

  async function avancarStatus() {
    setErroAvancar(null);
    setAvancando(true);
    try {
      // O odômetro só é pedido na saída da base (de Aceita para Equipe em deslocamento); em branco,
      // a API assume o odômetro atual do veículo.
      const body = remocao.status === 'Aceita' && odometroInicial !== '' ? { odometroInicial: Number(odometroInicial) } : undefined;
      await requisitar(`/remocao/${codigo}/avancar-status`, { method: 'PUT', token: sessao.token, body });
      setOdometroInicial('');
      recarregar();
    } catch (excecao) {
      setErroAvancar(excecao.cause || excecao.message);
    } finally {
      setAvancando(false);
    }
  }

  async function registrarRetornoBase(evento) {
    evento.preventDefault();
    setErroRetorno(null);
    setRegistrandoRetorno(true);
    try {
      await requisitar(`/remocao/${codigo}/retorno-base`, { method: 'PUT', token: sessao.token, body: { odometroFinal: Number(odometroFinal) } });
      setOdometroFinal('');
      recarregar();
    } catch (excecao) {
      setErroRetorno(excecao.cause || excecao.message);
    } finally {
      setRegistrandoRetorno(false);
    }
  }

  async function cancelar(evento) {
    evento.preventDefault();
    setErroCancelar(null);
    setCancelando(true);
    try {
      await requisitar(`/remocao/${codigo}/cancelar`, {
        method: 'PUT',
        token: sessao.token,
        body: { motivo: motivoCancelamento, observacao: observacaoCancelamento },
      });
      setCancelamentoAberto(false);
      recarregar();
    } catch (excecao) {
      setErroCancelar(excecao.cause || excecao.message);
    } finally {
      setCancelando(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !remocao) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Remoção não encontrada.'}</p>;
  }

  const podeAlocar = sessao.usuario.papeis.some((papel) => ['Admin', 'Regulador'].includes(papel));
  const podeVerValor = sessao.usuario.papeis.some((papel) => ['Admin', 'Regulador'].includes(papel));
  const agendada = Boolean(remocao.chegadaDestinoDesejada);
  const faltaHoraOrigem = agendada && !remocao.chegadaOrigemPrevista;
  const podeEditarAgendamento = podeAlocar && STATUS_COM_AGENDAMENTO_EDITAVEL.includes(remocao.status);
  const podeFinalizarAlocacao =
    podeAlocar && remocao.status === 'Solicitada' && Boolean(remocao.ambulancia) && Boolean(remocao.equipe?.length) && !faltaHoraOrigem;
  const podeAvancarStatus = podeAlocar && remocao.status !== 'Solicitada' && remocao.status !== 'Paga' && remocao.status !== 'Cancelada';
  const ehClienteDono = sessao.usuario.papeis.includes('Cliente') && sessao.usuario.cliente?.codigo === remocao.cliente?.codigo;
  const podeCancelar = (podeAlocar || ehClienteDono) && !STATUS_SEM_CANCELAMENTO.includes(remocao.status);
  const motivosDisponiveis = MOTIVOS_CANCELAMENTO.filter((motivo) => podeAlocar || !motivo.soOperacao);
  const podeRegistrarRetorno = podeAlocar && STATUS_COM_RETORNO_BASE.includes(remocao.status) && !remocao.retornoBaseEm;
  const teveAtendimento = Boolean(remocao.saidaBaseEm || remocao.chegadaOrigemEm || remocao.chegadaDestinoEm || remocao.retornoBaseEm);
  const kmRodados =
    remocao.odometroInicial != null && remocao.odometroFinal != null ? remocao.odometroFinal - remocao.odometroInicial : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Remoção #{remocao.codigo}</h1>
        <p className="mt-1 text-sm text-text-secundario">{rotuloStatus(remocao.status)}</p>
      </div>

      <RastreadorStatusRemocao status={remocao.status} />

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Dados gerais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="Tipo" valor={remocao.tipo} />
          <LinhaDetalhe
            rotulo="Solicitada em"
            valor={remocao.dataHoraSolicitacao ? new Date(remocao.dataHoraSolicitacao).toLocaleString('pt-BR') : null}
          />
          <LinhaDetalhe
            rotulo="Cliente"
            valor={remocao.cliente?.nomeFantasia || remocao.clienteAnonimo?.nome}
          />
          <LinhaDetalhe rotulo="Paciente" valor={remocao.paciente?.nome} />
        </div>
      </section>

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Origem e destino</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="Origem" valor={descreverLocal(remocao.origem)} />
          <LinhaDetalhe rotulo="Destino" valor={descreverLocal(remocao.destino)} />
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-xl bg-bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">Agendamento</h2>
          {podeAlocar && remocao.status === 'Solicitada' && faltaHoraOrigem && (
            <p className="mt-2 rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">
              Remoção agendada aguardando a decisão da regulação. Para aceitar, defina a chegada prevista na origem e siga com a
              alocação. Para recusar, use "Cancelar remoção" com o motivo "Sem ambulância disponível" ou "Sem equipe disponível" —
              o cliente é avisado por e-mail.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="Chegada no destino" valor={agendada ? formatarAgendamento(remocao.chegadaDestinoDesejada) : 'O quanto antes'} />
          <LinhaDetalhe rotulo="Chegada prevista na origem" valor={formatarAgendamento(remocao.chegadaOrigemPrevista) || 'A definir'} />
        </div>
        {podeEditarAgendamento && (
          <FormularioAgendamento
            key={`${remocao.chegadaOrigemPrevista}-${remocao.chegadaDestinoDesejada}`}
            remocao={remocao}
            token={sessao.token}
            aoSalvar={recarregar}
          />
        )}
      </section>

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Equipe e ambulância</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="Ambulância" valor={remocao.ambulancia ? `#${remocao.ambulancia.codigo}` : 'Não alocada'} />
          <LinhaDetalhe rotulo="Tipo de ambulância" valor={remocao.tipoAmbulanciaDemandada || 'Não definido'} />
          <LinhaDetalhe
            rotulo="Equipe"
            valor={remocao.equipe?.length ? remocao.equipe.map((p) => `${p.nome} (${p.tipo ? p.tipo.replace('_', ' ') : 'cadastro pendente'})`).join(', ') : 'Não alocada'}
          />
        </div>
      </section>

      {remocao.cancelamento && (
        <section className="rounded-xl bg-bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Cancelamento</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LinhaDetalhe rotulo="Cancelada em" valor={formatarHorario(remocao.cancelamento.em)} />
            <LinhaDetalhe rotulo="Motivo" valor={rotuloMotivoCancelamento(remocao.cancelamento.motivo)} />
            {remocao.cancelamento.observacao && (
              <div className="sm:col-span-2">
                <LinhaDetalhe rotulo="Observação" valor={remocao.cancelamento.observacao} />
              </div>
            )}
          </div>
        </section>
      )}

      {(teveAtendimento || podeRegistrarRetorno) && (
        <section className="flex flex-col gap-5 rounded-xl bg-bg-card p-6 shadow-sm">
          <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">Atendimento</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LinhaDetalhe rotulo="Saída da base" valor={formatarHorario(remocao.saidaBaseEm)} />
            <LinhaDetalhe rotulo="Chegada à origem" valor={formatarHorario(remocao.chegadaOrigemEm)} />
            <LinhaDetalhe rotulo="Chegada ao destino" valor={formatarHorario(remocao.chegadaDestinoEm)} />
            <LinhaDetalhe rotulo="Retorno à base" valor={formatarHorario(remocao.retornoBaseEm)} />
            <LinhaDetalhe rotulo="Odômetro na saída" valor={remocao.odometroInicial != null ? `${remocao.odometroInicial.toLocaleString('pt-BR')} km` : null} />
            <LinhaDetalhe rotulo="Odômetro no retorno" valor={remocao.odometroFinal != null ? `${remocao.odometroFinal.toLocaleString('pt-BR')} km` : null} />
            <LinhaDetalhe rotulo="Km rodados" valor={kmRodados != null ? `${kmRodados.toLocaleString('pt-BR')} km` : null} />
            <LinhaDetalhe rotulo="Duração (base a base)" valor={formatarDuracao(remocao.saidaBaseEm, remocao.retornoBaseEm)} />
          </div>

          {podeRegistrarRetorno && (
            <form onSubmit={registrarRetornoBase} className="flex flex-col gap-3 border-t border-text-secundario/15 pt-5">
              <p className="text-sm text-text-secundario">
                Registre o retorno quando a ambulância chegar à base. O horário é o deste momento, e os quilômetros rodados são
                calculados pelo odômetro.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
                <Campo rotulo="Odômetro no retorno (km)" obrigatorio>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={remocao.odometroInicial ?? 0}
                    step="1"
                    value={odometroFinal}
                    onChange={(e) => setOdometroFinal(e.target.value)}
                    required
                    className={CAMPO_CLASSES}
                  />
                </Campo>
                <button
                  type="submit"
                  disabled={registrandoRetorno}
                  className="rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {registrandoRetorno ? 'Registrando...' : 'Registrar retorno à base'}
                </button>
              </div>
              {erroRetorno && <p className="text-sm font-medium text-vermelho">{erroRetorno}</p>}
            </form>
          )}
        </section>
      )}

      {podeVerValor && (
        <section className="rounded-xl bg-bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Contabilidade</h2>
          <FormularioValorCobrado
            codigo={codigo}
            valorAtual={remocao.valorCobrado}
            token={sessao.token}
            aoSalvar={(valorCobrado) => setRemocao((atual) => ({ ...atual, valorCobrado }))}
          />
        </section>
      )}

      {podeAlocar && (
        <Link to={`/remocoes/${codigo}/alocar`} className="text-sm font-medium text-azul-petroleo hover:underline">
          Alocar equipe/ambulância →
        </Link>
      )}

      {podeAlocar && remocao.status === 'Solicitada' && (
        <section className="flex flex-col gap-3 rounded-xl bg-bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">Finalizar alocação</h2>
            <p className="mt-1 text-sm text-text-secundario">
              Marca a remoção como em andamento e avisa o cliente por e-mail que o atendimento começou. Exige ambulância e
              equipe já alocadas{agendada ? ' e, por ser agendada, a chegada prevista na origem' : ''}.
            </p>
          </div>

          {erroFinalizar && <p className="text-sm font-medium text-vermelho">{erroFinalizar}</p>}

          <button
            type="button"
            onClick={finalizarAlocacao}
            disabled={!podeFinalizarAlocacao || finalizando}
            className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {finalizando ? 'Finalizando...' : 'Finalizar alocação'}
          </button>
        </section>
      )}

      {(podeAvancarStatus || podeCancelar) && (
        <section className="flex flex-col gap-4 rounded-xl bg-bg-card p-6 shadow-sm">
          {podeAvancarStatus && remocao.status === 'Aceita' && (
            <div className="max-w-xs">
              <Campo rotulo="Odômetro na saída da base (km)">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={odometroInicial}
                  onChange={(e) => setOdometroInicial(e.target.value)}
                  placeholder="Em branco: odômetro atual do veículo"
                  className={CAMPO_CLASSES}
                />
              </Campo>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-3">
            {podeAvancarStatus && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={avancarStatus}
                  disabled={avancando}
                  className="rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {avancando ? 'Avançando...' : 'Avançar status'}
                </button>
                {erroAvancar && <p className="text-sm font-medium text-vermelho">{erroAvancar}</p>}
              </div>
            )}

            {podeCancelar && !cancelamentoAberto && (
              <button
                type="button"
                onClick={() => setCancelamentoAberto(true)}
                className="rounded-lg border border-vermelho px-6 py-2.5 text-sm font-semibold text-vermelho transition-colors hover:bg-vermelho/10"
              >
                Cancelar remoção
              </button>
            )}
          </div>

          {podeCancelar && cancelamentoAberto && (
            <form onSubmit={cancelar} className="flex flex-col gap-4">
              <p className="text-sm font-medium text-text-principal">Por que esta remoção está sendo cancelada?</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo rotulo="Motivo" obrigatorio>
                  <select value={motivoCancelamento} onChange={(e) => setMotivoCancelamento(e.target.value)} required className={CAMPO_CLASSES}>
                    <option value="">Selecione</option>
                    {motivosDisponiveis.map((motivo) => (
                      <option key={motivo.valor} value={motivo.valor}>
                        {motivo.rotulo}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo rotulo="Observação" obrigatorio={motivoCancelamento === 'Outro'}>
                  <input
                    value={observacaoCancelamento}
                    onChange={(e) => setObservacaoCancelamento(e.target.value)}
                    required={motivoCancelamento === 'Outro'}
                    maxLength={300}
                    className={CAMPO_CLASSES}
                  />
                </Campo>
              </div>
              {erroCancelar && <p className="text-sm font-medium text-vermelho">{erroCancelar}</p>}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={cancelando}
                  className="rounded-lg bg-vermelho px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-vermelho/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelamentoAberto(false)}
                  className="rounded-lg border border-text-secundario/30 px-6 py-2.5 text-sm font-semibold text-text-principal transition-colors hover:bg-bg-app"
                >
                  Voltar
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <HistoricoAcoes entidade="remocao" codigo={Number(codigo)} />
    </div>
  );
}
