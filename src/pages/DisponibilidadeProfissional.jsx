import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const DIAS_SEMANA = [
  { valor: 'segunda', rotulo: 'Segunda-feira' },
  { valor: 'terca', rotulo: 'Terça-feira' },
  { valor: 'quarta', rotulo: 'Quarta-feira' },
  { valor: 'quinta', rotulo: 'Quinta-feira' },
  { valor: 'sexta', rotulo: 'Sexta-feira' },
  { valor: 'sabado', rotulo: 'Sábado' },
  { valor: 'domingo', rotulo: 'Domingo' },
];

function gradeInicial() {
  return Object.fromEntries(DIAS_SEMANA.map(({ valor }) => [valor, { ativo: false, horaInicio: '08:00', horaFim: '18:00' }]));
}

export function DisponibilidadeProfissional() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [profissional, setProfissional] = useState(null);
  const [grade, setGrade] = useState(gradeInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  useEffect(() => {
    setCarregando(true);
    Promise.all([
      requisitar(`/profissional/${codigo}`, { token: sessao.token }),
      requisitar(`/profissional/${codigo}/disponibilidade`, { token: sessao.token }),
    ])
      .then(([dadosProfissional, disponibilidade]) => {
        setProfissional(dadosProfissional);
        setGrade((atual) => {
          const nova = { ...atual };
          disponibilidade.forEach((item) => {
            if (nova[item.diaSemana]) {
              nova[item.diaSemana] = { ativo: true, horaInicio: item.horaInicio, horaFim: item.horaFim };
            }
          });
          return nova;
        });
      })
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [codigo, sessao.token]);

  function alternarDia(dia) {
    setGrade((atual) => ({ ...atual, [dia]: { ...atual[dia], ativo: !atual[dia].ativo } }));
  }

  function atualizarHorario(dia, campo, valor) {
    setGrade((atual) => ({ ...atual, [dia]: { ...atual[dia], [campo]: valor } }));
  }

  async function salvar() {
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    try {
      const disponibilidade = DIAS_SEMANA.filter(({ valor }) => grade[valor].ativo).map(({ valor }) => ({
        diaSemana: valor,
        horaInicio: grade[valor].horaInicio,
        horaFim: grade[valor].horaFim,
      }));

      await requisitar(`/profissional/${codigo}/disponibilidade`, {
        method: 'PUT',
        body: { disponibilidade },
        token: sessao.token,
      });
      setSucesso('Indisponibilidade salva com sucesso.');
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link to="/" className="text-sm font-medium text-azul-petroleo hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-chumbo">Indisponibilidade</h1>
        {profissional && (
          <p className="mt-1 text-sm text-text-secundario">
            {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome}
            {profissional.tipo ? ` · ${profissional.tipo.replace('_', ' ')}` : ''} · código {profissional.codigo}
          </p>
        )}
        <p className="mt-2 text-sm text-text-secundario">
          Por padrão o profissional está disponível o tempo todo. Marque abaixo apenas os dias e horários em que ele{' '}
          <strong>não</strong> pode ser escalado.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-azul-petroleo text-left text-white">
              <th className="px-5 py-3 font-bold">Dia da semana</th>
              <th className="px-5 py-3 font-bold">Indisponível</th>
              <th className="px-5 py-3 font-bold">Início</th>
              <th className="px-5 py-3 font-bold">Fim</th>
            </tr>
          </thead>
          <tbody>
            {DIAS_SEMANA.map(({ valor, rotulo }) => (
              <tr key={valor} className="border-t border-text-secundario/10">
                <td className="px-5 py-3 font-medium text-text-principal">{rotulo}</td>
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={grade[valor].ativo}
                    onChange={() => alternarDia(valor)}
                    className="size-4 accent-azul-petroleo"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="time"
                    value={grade[valor].horaInicio}
                    disabled={!grade[valor].ativo}
                    onChange={(evento) => atualizarHorario(valor, 'horaInicio', evento.target.value)}
                    className="rounded-lg border border-text-secundario/30 px-2 py-1.5 text-sm outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="time"
                    value={grade[valor].horaFim}
                    disabled={!grade[valor].ativo}
                    onChange={(evento) => atualizarHorario(valor, 'horaFim', evento.target.value)}
                    className="rounded-lg border border-text-secundario/30 px-2 py-1.5 text-sm outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {sucesso && <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">{sucesso}</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {salvando ? 'Salvando...' : 'Salvar indisponibilidade'}
      </button>
    </div>
  );
}
