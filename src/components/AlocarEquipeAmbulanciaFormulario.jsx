import { useEffect, useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';

// props:
// - remocaoId: código da remoção sendo alocada
// - aoSucesso(resultado): callback opcional
export function AlocarEquipeAmbulanciaFormulario({ remocaoId, aoSucesso }) {
  const { sessao } = useAuth();
  const [ambulancias, setAmbulancias] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [ambulanciaCodigo, setAmbulanciaCodigo] = useState('');
  const [equipeSelecionada, setEquipeSelecionada] = useState([]);
  const [confirmarConflito, setConfirmarConflito] = useState(false);
  const [conflitos, setConflitos] = useState(null);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    requisitar('/ambulancia?disponivel=true', { token: sessao.token }).then(setAmbulancias).catch((e) => setErro(e.message));
    requisitar('/profissional', { token: sessao.token }).then(setProfissionais).catch((e) => setErro(e.message));
  }, [sessao.token]);

  function alternarProfissional(codigo) {
    setEquipeSelecionada((atual) => (atual.includes(codigo) ? atual.filter((c) => c !== codigo) : [...atual, codigo]));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    setConflitos(null);
    setSucesso(null);

    if (!ambulanciaCodigo || equipeSelecionada.length === 0) {
      setErro('Selecione uma ambulância e ao menos um profissional para a equipe.');
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        ambulancia: { codigo: Number(ambulanciaCodigo) },
        equipe: equipeSelecionada.map((codigo) => ({ codigo })),
        ignorarConflitosDisponibilidade: confirmarConflito,
      };
      const resultado = await requisitar(`/remocao/${remocaoId}`, { method: 'PUT', body: payload, token: sessao.token });
      setSucesso(resultado);
      aoSucesso?.(resultado);
    } catch (excecao) {
      if (excecao.status === 409) {
        setConflitos(excecao.detalhes);
        setErro(excecao.cause || excecao.message);
      } else {
        setErro(excecao.cause || excecao.message);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={enviar}>
      <Secao titulo="Ambulância">
        <Campo rotulo="Ambulância disponível" obrigatorio>
          <select value={ambulanciaCodigo} onChange={(e) => setAmbulanciaCodigo(e.target.value)} required className={CAMPO_CLASSES}>
            <option value="">Selecione</option>
            {ambulancias.map((ambulancia) => (
              <option key={ambulancia.codigo} value={ambulancia.codigo}>
                #{ambulancia.codigo} — {ambulancia.modelo} ({ambulancia.placaIdentificador})
              </option>
            ))}
          </select>
        </Campo>
      </Secao>

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Equipe (motorista + técnico obrigatórios)</h2>
        <div className="flex flex-col gap-2">
          {profissionais.map((profissional) => (
            <label key={profissional.codigo} className="flex items-center gap-2 text-sm text-text-principal">
              <input
                type="checkbox"
                checked={equipeSelecionada.includes(profissional.codigo)}
                onChange={() => alternarProfissional(profissional.codigo)}
                className="size-4"
              />
              {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome} — {profissional.tipo.replace('_', ' ')}
            </label>
          ))}
        </div>
      </section>

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

      {erro && !conflitos && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {sucesso && (
        <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">
          Equipe e ambulância alocadas com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Salvando...' : 'Alocar equipe e ambulância'}
      </button>
    </form>
  );
}
