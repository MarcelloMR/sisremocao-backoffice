import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AmbulanciaFormulario } from '../components/AmbulanciaFormulario.jsx';

function paraValoresIniciais(ambulancia) {
  const carro = ambulancia.carro || {};

  return {
    status: ambulancia.status,
    numeroIdentificacao: ambulancia.numeroIdentificacao ?? '',
    utiMovel: Boolean(ambulancia.utiMovel),
    modelo: carro.modelo || '',
    fabricante: carro.fabricante || '',
    ano: carro.ano ?? '',
    anoModelo: carro.anoModelo ?? '',
    anoAquisicao: carro.anoAquisicao ?? '',
    quilometragemMarcador: carro.quilometragemMarcador ?? '',
    placaIdentificador: carro.placaIdentificador || '',
    chassi: carro.chassi || '',
    estadoSigla: '',
    municipioCodigo: carro.municipio?.codigo || '',
  };
}

export function EditarAmbulancia() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [ambulancia, setAmbulancia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    requisitar(`/ambulancia/${codigo}`, { token: sessao.token })
      .then(setAmbulancia)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [codigo, sessao.token]);

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !ambulancia) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Ambulância não encontrada.'}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Atualizar Ambulância #{ambulancia.codigo}</h1>
      </div>

      <AmbulanciaFormulario
        valoresIniciais={paraValoresIniciais(ambulancia)}
        rotuloBotao="Salvar alterações"
        enviar={(payload) => requisitar(`/ambulancia/${codigo}`, { method: 'PUT', body: payload, token: sessao.token })}
      />
    </div>
  );
}
