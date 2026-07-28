import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AmbulanciaFormulario } from '../components/AmbulanciaFormulario.jsx';

export function CadastroAmbulancia() {
  const { sessao } = useAuth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Cadastrar Ambulância</h1>
        <p className="mt-1 text-sm text-text-secundario">A placa deve seguir o padrão ABC1234 (3 letras + 4 números).</p>
      </div>

      <AmbulanciaFormulario
        rotuloBotao="Cadastrar Ambulância"
        resetarAoSalvar
        enviar={(payload) => requisitar('/ambulancia', { method: 'POST', body: payload, token: sessao.token })}
      />
    </div>
  );
}
