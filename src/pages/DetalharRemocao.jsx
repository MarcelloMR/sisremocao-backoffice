import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold uppercase tracking-wide text-text-secundario">{rotulo}</span>
      <span className="text-sm font-medium text-text-principal">{valor ?? '—'}</span>
    </div>
  );
}

function descreverLocal(local) {
  if (!local) return '—';
  if (local.hospital) return local.hospital.nome;
  if (local.endereco) return local.endereco.logradouro;
  return '—';
}

export function DetalharRemocao() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [remocao, setRemocao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    requisitar(`/remocao/${codigo}`, { token: sessao.token })
      .then(setRemocao)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [codigo, sessao.token]);

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !remocao) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Remoção não encontrada.'}</p>;
  }

  const podeAlocar = ['Admin', 'GestorAmbulancia', 'Regulador'].includes(sessao.usuario.papel);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Remoção #{remocao.codigo}</h1>
        <p className="mt-1 text-sm text-text-secundario">{remocao.status.replace('_', ' ')}</p>
      </div>

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

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Equipe e ambulância</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="Ambulância" valor={remocao.ambulancia ? `#${remocao.ambulancia.codigo}` : 'Não alocada'} />
          <LinhaDetalhe
            rotulo="Equipe"
            valor={remocao.equipe?.length ? remocao.equipe.map((p) => `${p.nome} (${p.tipo.replace('_', ' ')})`).join(', ') : 'Não alocada'}
          />
        </div>
      </section>

      {podeAlocar && (
        <Link to={`/remocoes/${codigo}/alocar`} className="text-sm font-medium text-azul-petroleo hover:underline">
          Alocar equipe/ambulância →
        </Link>
      )}
    </div>
  );
}
