import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ProfissionalFormulario } from '../components/ProfissionalFormulario.jsx';

export function CadastroProfissional() {
  const { sessao } = useAuth();
  const [codigoCriado, setCodigoCriado] = useState(null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Cadastrar Profissional</h1>
        <p className="mt-1 text-sm text-text-secundario">Processo "Cadastrar Profissional" — a máscara do CPF é validada no envio.</p>
      </div>

      <ProfissionalFormulario
        rotuloBotao="Cadastrar Profissional"
        resetarAoSalvar
        enviar={(payload) => requisitar('/profissional', { method: 'POST', body: payload, token: sessao.token })}
        aoSucesso={(resultado) => setCodigoCriado(resultado.codigo)}
      />

      {codigoCriado && (
        <Link to={`/profissionais/${codigoCriado}/disponibilidade`} className="text-sm font-medium text-azul-petroleo hover:underline">
          Definir disponibilidade do profissional cadastrado →
        </Link>
      )}
    </div>
  );
}
