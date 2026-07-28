import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RemocaoFormulario } from '../components/RemocaoFormulario.jsx';

export function SolicitarRemocao() {
  const { sessao } = useAuth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Solicitar Remoção</h1>
        <p className="mt-1 text-sm text-text-secundario">
          Busque o endereço de origem e destino a partir das sugestões — a equipe do ProCoração será notificada
          assim que a solicitação for registrada.
        </p>
      </div>

      <RemocaoFormulario enviar={(payload) => requisitar('/remocao', { method: 'POST', body: payload, token: sessao.token })} />
    </div>
  );
}
