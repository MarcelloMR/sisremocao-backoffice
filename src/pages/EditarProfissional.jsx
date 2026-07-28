import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ProfissionalFormulario } from '../components/ProfissionalFormulario.jsx';

function paraValoresIniciais(profissional) {
  const pessoa = profissional.dadosPessoais;
  const endereco = pessoa.endereco || {};
  const municipio = endereco.municipio || {};

  return {
    tipo: profissional.tipo,
    numeroRegistroConselho: profissional.numeroRegistroConselho || '',
    especialidade: profissional.especialidade || '',
    nome: pessoa.nome || '',
    sobrenome: pessoa.sobrenome || '',
    dataNascimento: pessoa.dataNascimento || '',
    cpf: pessoa.cpf || '',
    sexo: pessoa.sexo || 'Masculino',
    email: pessoa.email || '',
    logradouro: endereco.logradouro || '',
    numero: endereco.numero ?? '',
    complemento: endereco.complemento || '',
    bairro: endereco.bairro || '',
    cep: endereco.cep || '',
    estadoSigla: municipio.unidadeFederacao?.sigla || '',
    municipioCodigo: municipio.codigo || '',
  };
}

export function EditarProfissional() {
  const { codigo } = useParams();
  const { sessao } = useAuth();
  const [profissional, setProfissional] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    requisitar(`/profissional/${codigo}`, { token: sessao.token })
      .then(setProfissional)
      .catch((excecao) => setErro(excecao.cause || excecao.message))
      .finally(() => setCarregando(false));
  }, [codigo, sessao.token]);

  if (carregando) {
    return <p className="text-sm text-text-secundario">Carregando...</p>;
  }

  if (erro || !profissional) {
    return <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro || 'Profissional não encontrado.'}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">
          Atualizar Profissional — {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome}
        </h1>
        <p className="mt-1 text-sm text-text-secundario">Nome, sobrenome e CPF não podem ser alterados.</p>
      </div>

      <ProfissionalFormulario
        valoresIniciais={paraValoresIniciais(profissional)}
        bloquearIdentidade
        rotuloBotao="Salvar alterações"
        enviar={(payload) => requisitar(`/profissional/${codigo}`, { method: 'PUT', body: payload, token: sessao.token })}
      />

      <Link to={`/profissionais/${codigo}/disponibilidade`} className="text-sm font-medium text-azul-petroleo hover:underline">
        Editar disponibilidade →
      </Link>
    </div>
  );
}
