import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RepresentantesCliente } from '../components/RepresentantesCliente.jsx';

function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold uppercase tracking-wide text-text-secundario">{rotulo}</span>
      <span className="text-sm font-medium text-text-principal">{valor ?? '—'}</span>
    </div>
  );
}

export function DetalharCliente() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  function recarregar() {
    requisitar(`/cliente/${codigo}`, { token: sessao.token })
      .then(setCliente)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }

  useEffect(recarregar, [codigo, sessao.token]);

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !cliente) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Cliente não encontrado.'}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">{cliente.nomeFantasia}</h1>
        <p className="mt-1 text-sm text-text-secundario">{cliente.cnpj}</p>
      </div>

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Dados gerais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LinhaDetalhe rotulo="CNPJ" valor={cliente.cnpj} />
          <LinhaDetalhe
            rotulo="Início de vigência"
            valor={cliente.inicioVigencia ? new Date(cliente.inicioVigencia).toLocaleDateString('pt-BR') : null}
          />
          <LinhaDetalhe rotulo="Município" valor={cliente.endereco?.municipio?.nome} />
          <LinhaDetalhe rotulo="Estado" valor={cliente.endereco?.municipio?.unidadeFederacao?.sigla} />
        </div>
      </section>

      <RepresentantesCliente clienteId={codigo} representantes={cliente.representantes || []} aoAdicionar={recarregar} />

      <Link to={`/clientes/${codigo}/editar`} className="text-sm font-medium text-azul-petroleo hover:underline">
        Editar dados do cliente →
      </Link>
    </div>
  );
}
