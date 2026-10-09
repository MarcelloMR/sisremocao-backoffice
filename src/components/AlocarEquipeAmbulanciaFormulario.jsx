import { useEffect, useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';

const TIPOS_AMBULANCIA_DEMANDADA = ['Basica', 'UTI'];

// props:
// - remocaoId: código da remoção sendo alocada
// - tipoAmbulanciaDemandadaAtual: valor já salvo na remoção (para pré-selecionar o campo)
// - ambulanciaJaAlocada / equipeJaAlocada: desabilita o respectivo formulário quando a remoção já
//   tem ambulância/equipe salva — evita realocar por engano sem antes desfazer a alocação atual
//   (não existe endpoint de "desalocar" ainda; a tela de detalhe da remoção é o lugar pra isso, se
//   vier a ser pedido).
// - aoSucesso(resultado): callback opcional
//
// Ambulância e equipe são alocadas de forma independente (dois botões, dois PUTs) — decisão de
// produto de 2026-09-21: pode-se confirmar a equipe antes de uma ambulância ficar livre, ou alocar
// a ambulância antes de definir quem vai na equipe. O backend já suporta isso: PUT /remocao/:codigo
// só valida a composição da equipe (motorista + técnico/enfermeiro) quando `equipe` é enviado no
// payload, e só dispara a notificação de confirmação quando ambos já estão presentes (o que acabou
// de ser enviado ou já salvo antes).
export function AlocarEquipeAmbulanciaFormulario({
  remocaoId,
  tipoAmbulanciaDemandadaAtual,
  ambulanciaJaAlocada,
  equipeJaAlocada,
  aoSucesso,
}) {
  const { sessao } = useAuth();
  const [ambulancias, setAmbulancias] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [ambulanciaCodigo, setAmbulanciaCodigo] = useState('');
  const [tipoAmbulanciaDemandada, setTipoAmbulanciaDemandada] = useState(tipoAmbulanciaDemandadaAtual || '');
  const [equipeSelecionada, setEquipeSelecionada] = useState([]);
  const [confirmarConflito, setConfirmarConflito] = useState(false);
  const [conflitos, setConflitos] = useState(null);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(null);

  useEffect(() => {
    requisitar('/ambulancia?disponivel=true', { token: sessao.token }).then(setAmbulancias).catch((e) => setErro(e.message));
    requisitar('/profissional', { token: sessao.token }).then(setProfissionais).catch((e) => setErro(e.message));
  }, [sessao.token]);

  function alternarProfissional(codigo) {
    setEquipeSelecionada((atual) => (atual.includes(codigo) ? atual.filter((c) => c !== codigo) : [...atual, codigo]));
  }

  async function enviarAmbulancia(evento) {
    evento.preventDefault();
    setErro(null);
    setConflitos(null);
    setSucesso(null);

    if (!ambulanciaCodigo) {
      setErro('Selecione uma ambulância.');
      return;
    }

    setEnviando('ambulancia');
    try {
      const payload = {
        ambulancia: { codigo: Number(ambulanciaCodigo) },
        ...(tipoAmbulanciaDemandada ? { tipoAmbulanciaDemandada } : {}),
      };
      const resultado = await requisitar(`/remocao/${remocaoId}`, { method: 'PUT', body: payload, token: sessao.token });
      setSucesso('ambulancia');
      aoSucesso?.(resultado);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setEnviando(null);
    }
  }

  async function enviarEquipe(evento) {
    evento.preventDefault();
    setErro(null);
    setConflitos(null);
    setSucesso(null);

    if (equipeSelecionada.length === 0) {
      setErro('Selecione ao menos um profissional para a equipe.');
      return;
    }

    setEnviando('equipe');
    try {
      const payload = {
        equipe: equipeSelecionada.map((codigo) => ({ codigo })),
        ignorarConflitosDisponibilidade: confirmarConflito,
      };
      const resultado = await requisitar(`/remocao/${remocaoId}`, { method: 'PUT', body: payload, token: sessao.token });
      setSucesso('equipe');
      aoSucesso?.(resultado);
    } catch (excecao) {
      if (excecao.status === 409) {
        setConflitos(excecao.detalhes);
        setErro(excecao.cause || excecao.message);
      } else {
        setErro(excecao.cause || excecao.message);
      }
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-4 rounded-xl bg-bg-card p-6 shadow-sm" onSubmit={enviarAmbulancia}>
        <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">Ambulância</h2>
        <Campo rotulo="Tipo de ambulância">
          <select
            value={tipoAmbulanciaDemandada}
            onChange={(e) => setTipoAmbulanciaDemandada(e.target.value)}
            disabled={ambulanciaJaAlocada}
            className={CAMPO_CLASSES}
          >
            <option value="">Não definido</option>
            {TIPOS_AMBULANCIA_DEMANDADA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo === 'UTI' ? 'UTI' : 'Básica'}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Ambulância disponível" obrigatorio>
          <select
            value={ambulanciaCodigo}
            onChange={(e) => setAmbulanciaCodigo(e.target.value)}
            required
            disabled={ambulanciaJaAlocada}
            className={CAMPO_CLASSES}
          >
            <option value="">Selecione</option>
            {ambulancias.map((ambulancia) => (
              <option key={ambulancia.codigo} value={ambulancia.codigo}>
                #{ambulancia.codigo} — {ambulancia.modelo} ({ambulancia.placaIdentificador})
              </option>
            ))}
          </select>
        </Campo>

        {ambulanciaJaAlocada && (
          <p className="rounded-lg bg-bg-app px-4 py-3 text-sm text-text-secundario">Esta remoção já tem uma ambulância alocada.</p>
        )}
        {sucesso === 'ambulancia' && (
          <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">Ambulância alocada com sucesso.</p>
        )}

        <button
          type="submit"
          disabled={enviando === 'ambulancia' || ambulanciaJaAlocada}
          className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando === 'ambulancia' ? 'Salvando...' : 'Alocar ambulância'}
        </button>
      </form>

      <form className="flex flex-col gap-4 rounded-xl bg-bg-card p-6 shadow-sm" onSubmit={enviarEquipe}>
        <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">
          Equipe (motorista + técnico em enfermagem ou enfermeiro obrigatórios)
        </h2>
        <div className="flex flex-col gap-2">
          {profissionais.map((profissional) => (
            <label key={profissional.codigo} className="flex items-center gap-2 text-sm text-text-principal">
              <input
                type="checkbox"
                checked={equipeSelecionada.includes(profissional.codigo)}
                onChange={() => alternarProfissional(profissional.codigo)}
                disabled={equipeJaAlocada}
                className="size-4"
              />
              {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome} — {profissional.tipo.replace('_', ' ')}
            </label>
          ))}
        </div>

        {equipeJaAlocada && (
          <p className="rounded-lg bg-bg-app px-4 py-3 text-sm text-text-secundario">Esta remoção já tem uma equipe alocada.</p>
        )}

        {conflitos && (
          <div className="flex flex-col gap-2 rounded-lg bg-vermelho/10 px-4 py-3 text-sm text-vermelho">
            <p className="font-medium">Profissional(is) escalado(s) sem disponibilidade no horário:</p>
            <ul className="list-disc pl-5">
              {conflitos.map((item) => (
                <li key={item.codigo}>
                  {item.nome} ({item.tipo.replace('_', ' ')})
                </li>
              ))}
            </ul>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={confirmarConflito} onChange={(e) => setConfirmarConflito(e.target.checked)} className="size-4" />
              Confirmar mesmo assim
            </label>
          </div>
        )}

        {sucesso === 'equipe' && (
          <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">Equipe alocada com sucesso.</p>
        )}

        <button
          type="submit"
          disabled={enviando === 'equipe' || equipeJaAlocada}
          className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando === 'equipe' ? 'Salvando...' : 'Alocar equipe'}
        </button>
      </form>

      {erro && !conflitos && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
    </div>
  );
}
