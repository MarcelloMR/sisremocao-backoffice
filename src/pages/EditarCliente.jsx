import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ClienteFormulario } from '../components/ClienteFormulario.jsx';

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

export function EditarCliente() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    requisitar(`/cliente/${codigo}`, { token: sessao.token })
      .then(setCliente)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [codigo, sessao.token]);

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !cliente) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Cliente não encontrado.'}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Atualizar Cliente — {cliente.nomeFantasia}</h1>
      </div>

      <ClienteFormulario
        valoresIniciais={paraValoresIniciais(cliente)}
        rotuloBotao="Salvar alterações"
        enviar={(payload) => requisitar(`/cliente/${codigo}`, { method: 'PUT', body: payload, token: sessao.token })}
      />
    </div>
  );
}
