import { useParams } from 'react-router-dom';
import { AlocarEquipeAmbulanciaFormulario } from '../components/AlocarEquipeAmbulanciaFormulario.jsx';

export function AlocarRemocao() {
  const { codigo } = useParams();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Alocar Remoção #{codigo}</h1>
        <p className="mt-1 text-sm text-text-secundario">
          Selecione a ambulância e a equipe. O cliente será notificado por e-mail assim que a alocação for confirmada.
        </p>
      </div>

      <AlocarEquipeAmbulanciaFormulario remocaoId={codigo} />
    </div>
  );
}
