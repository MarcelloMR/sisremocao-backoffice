import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPO_CLASSES } from './CampoFormulario.jsx';

function formatarPeriodo(periodo, granularidade) {
  const data = new Date(periodo);
  if (granularidade === 'semana') {
    return `Sem. ${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }
  return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

// Gráfico de demanda de remoções por período, com granularidade alternável entre semana e mês.
// Sem props: busca a própria fatia (Cliente vê só a própria demanda, Admin/Regulador veem a geral
// — a segurança é aplicada no backend, não aqui).
export function GraficoDemanda() {
  const { sessao } = useAuth();
  const [granularidade, setGranularidade] = useState('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    const parametros = new URLSearchParams({ granularidade });
    if (dataInicio) parametros.set('dataInicio', dataInicio);
    if (dataFim) parametros.set('dataFim', dataFim);

    requisitar(`/remocao/demanda?${parametros.toString()}`, { token: sessao.token })
      .then((resposta) => setDados(resposta.map((item) => ({ ...item, rotulo: formatarPeriodo(item.periodo, granularidade) }))))
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [granularidade, dataInicio, dataFim, sessao.token]);

  return (
    <section className="rounded-xl bg-bg-card p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-chumbo uppercase tracking-wide">Demanda de remoções</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            De
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={CAMPO_CLASSES} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Até
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={CAMPO_CLASSES} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Agrupar por
            <select value={granularidade} onChange={(e) => setGranularidade(e.target.value)} className={CAMPO_CLASSES}>
              <option value="semana">Semana</option>
              <option value="mes">Mês</option>
            </select>
          </label>
        </div>
      </div>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}

      {!erro && !carregando && dados.length === 0 && (
        <p className="py-8 text-center text-sm font-medium text-text-secundario">Nenhuma remoção no período selecionado.</p>
      )}

      {!erro && dados.length > 0 && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ed" />
              <XAxis dataKey="rotulo" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(valor) => [valor, 'Remoções']} />
              <Bar dataKey="quantidade" fill="#557a82" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
