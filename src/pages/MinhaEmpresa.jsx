import { useEffect, useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ClienteFormulario } from '../components/ClienteFormulario.jsx';
import { RepresentantesCliente } from '../components/RepresentantesCliente.jsx';

function paraValoresIniciais(cliente) {
  const endereco = cliente.endereco || {};
  const municipio = endereco.municipio || {};

  return {
    nomeFantasia: cliente.nomeFantasia || '',
    cnpj: cliente.cnpj || '',
    inicioVigencia: cliente.inicioVigencia ? cliente.inicioVigencia.slice(0, 10) : '',
    logradouro: endereco.logradouro || '',
    numero: endereco.numero ?? '',
    complemento: endereco.complemento || '',
    bairro: endereco.bairro || '',
    cep: endereco.cep || '',
    estadoSigla: municipio.unidadeFederacao?.sigla || '',
    municipioCodigo: municipio.codigo || '',
  };
}

// Tela do cliente_admin (ver migração 0023): edita os dados da própria empresa e convida
// cliente_user, sem depender do Admin/Regulador do sisRemoção. Resolve a empresa pelo token
// (sessao.usuario.cliente.codigo), nunca por um :codigo na URL.
export function MinhaEmpresa() {
  const { sessao } = useAuth();
  const clienteId = sessao.usuario.cliente?.codigo;
  const ehClienteAdmin = sessao.usuario.clienteTipo === 'Admin';
  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  function recarregar() {
    if (!ehClienteAdmin) {
      return;
    }
    requisitar(`/cliente/${clienteId}`, { token: sessao.token })
      .then(setCliente)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }

  useEffect(recarregar, [clienteId, sessao.token, ehClienteAdmin]);

  if (!ehClienteAdmin) {
    return (
      <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">
        Esta página é exclusiva de quem administra a conta da empresa.
      </p>
    );
  }

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !cliente) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Empresa não encontrada.'}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Minha Empresa — {cliente.nomeFantasia}</h1>
        <p className="mt-1 text-sm text-text-secundario">Edite os dados da sua empresa e convide outros usuários para solicitar remoções.</p>
      </div>

      <RepresentantesCliente
        rotaConvite="/cliente/me/representantes"
        representantes={cliente.representantes || []}
        aoAdicionar={recarregar}
      />

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Dados da empresa</h2>
        <ClienteFormulario
          valoresIniciais={paraValoresIniciais(cliente)}
          rotuloBotao="Salvar alterações"
          enviar={(payload) => requisitar('/cliente/me', { method: 'PUT', body: payload, token: sessao.token })}
        />
      </section>
    </div>
  );
}
