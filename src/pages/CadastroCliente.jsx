import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ClienteFormulario } from '../components/ClienteFormulario.jsx';

export function CadastroCliente() {
  const { sessao } = useAuth();
  const [codigoCriado, setCodigoCriado] = useState(null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Cadastrar Cliente</h1>
        <p className="mt-1 text-sm text-text-secundario">Cadastro de cliente pessoa jurídica (empresa, prefeitura etc.).</p>
      </div>

      <ClienteFormulario
        rotuloBotao="Cadastrar Cliente"
        resetarAoSalvar
        enviar={(payload) => requisitar('/cliente', { method: 'POST', body: payload, token: sessao.token })}
        aoSucesso={(resultado) => setCodigoCriado(resultado.codigo)}
      />

      {codigoCriado && (
        <Link to={`/clientes/${codigoCriado}`} className="text-sm font-medium text-azul-petroleo hover:underline">
          Adicionar representantes ao cliente cadastrado →
        </Link>
      )}
    </div>
  );
}
