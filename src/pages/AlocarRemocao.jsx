import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AlocarEquipeAmbulanciaFormulario } from '../components/AlocarEquipeAmbulanciaFormulario.jsx';

export function AlocarRemocao() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [remocao, setRemocao] = useState(null);

  const recarregar = useCallback(() => {
    requisitar(`/remocao/${codigo}`, { token: sessao.token })
      .then(setRemocao)
      .catch(() => setRemocao(undefined));
  }, [codigo, sessao.token]);

  useEffect(recarregar, [recarregar]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Alocar Remoção #{codigo}</h1>
        <p className="mt-1 text-sm text-text-secundario">
          Selecione a ambulância e a equipe. O cliente será notificado por e-mail assim que a alocação for confirmada.
        </p>
      </div>

      {remocao !== null && (
        <AlocarEquipeAmbulanciaFormulario
          remocaoId={codigo}
          tipoAmbulanciaDemandadaAtual={remocao?.tipoAmbulanciaDemandada}
          ambulanciaJaAlocada={Boolean(remocao?.ambulancia)}
          equipeJaAlocada={Boolean(remocao?.equipe?.length)}
          aoSucesso={recarregar}
        />
      )}
    </div>
  );
}
