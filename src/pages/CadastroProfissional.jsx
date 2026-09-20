import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ConvidarProfissionalFormulario } from '../components/ConvidarProfissionalFormulario.jsx';

export function CadastroProfissional() {
  const { sessao } = useAuth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Convidar Profissional</h1>
        <p className="mt-1 text-sm text-text-secundario">
          Informe nome, sobrenome e e-mail. O profissional recebe um convite por e-mail para completar o próprio cadastro
          (documentos, contato e registro profissional).
        </p>
      </div>

      <ConvidarProfissionalFormulario enviar={(payload) => requisitar('/profissional', { method: 'POST', body: payload, token: sessao.token })} />
    </div>
  );
}
