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

export function DetalharAmbulancia() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [ambulancia, setAmbulancia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    requisitar(`/ambulancia/${codigo}`, { token: sessao.token })
      .then(setAmbulancia)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [codigo, sessao.token]);

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !ambulancia) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Ambulância não encontrada.'}</p>;
  }

  const carro = ambulancia.carro;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Ambulância #{ambulancia.codigo}</h1>
        <p className="mt-1 text-sm text-text-secundario">{ambulancia.ativo ? 'Ativa' : 'Removida'}</p>
      </div>

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Dados da ambulância</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="Status" valor={ambulancia.status.replace('_', ' ')} />
          <LinhaDetalhe rotulo="Número de identificação" valor={ambulancia.numeroIdentificacao} />
          <LinhaDetalhe rotulo="UTI Móvel" valor={ambulancia.utiMovel ? 'Sim' : 'Não'} />
        </div>
      </section>

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Dados do veículo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="Modelo" valor={carro.modelo} />
          <LinhaDetalhe rotulo="Fabricante" valor={carro.fabricante} />
          <LinhaDetalhe rotulo="Ano" valor={carro.ano} />
          <LinhaDetalhe rotulo="Ano modelo" valor={carro.anoModelo} />
          <LinhaDetalhe rotulo="Ano de aquisição" valor={carro.anoAquisicao} />
          <LinhaDetalhe rotulo="Quilometragem" valor={carro.quilometragemMarcador} />
          <LinhaDetalhe rotulo="Placa" valor={carro.placaIdentificador} />
          <LinhaDetalhe rotulo="Chassi" valor={carro.chassi} />
        </div>
      </section>

      <Link to={`/ambulancias/${codigo}/editar`} className="text-sm font-medium text-azul-petroleo hover:underline">
        Editar ambulância →
      </Link>
    </div>
  );
}
