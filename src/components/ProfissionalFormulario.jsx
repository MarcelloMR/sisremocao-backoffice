import { useEffect, useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';

const TIPOS_PROFISSIONAL = ['Medico', 'Enfermeiro', 'Motorista', 'Tecnico_Enfermagem'];

const FORM_VAZIO = {
  tipo: 'Motorista',
  numeroRegistroConselho: '',
  especialidade: '',
  nome: '',
  sobrenome: '',
  dataNascimento: '',
  cpf: '',
  sexo: 'Masculino',
  email: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cep: '',
  estadoSigla: '',
  municipioCodigo: '',
};

// omitirIdentidade: não manda nome/sobrenome/cpf — a API rejeita com 400 se esses campos
// vierem em uma atualização (RN: não editáveis após o cadastro), então a tela de edição nunca
// deve enviá-los, mesmo que os inputs (desabilitados) ainda tenham esses valores no estado.
export function montarPayloadProfissional(form, { omitirIdentidade } = {}) {
  const dadosPessoais = {
    dataNascimento: form.dataNascimento,
    sexo: form.sexo,
    email: form.email || undefined,
    role: 'Profissional',
    endereco: {
      logradouro: form.logradouro || undefined,
      numero: form.numero ? Number(form.numero) : undefined,
      complemento: form.complemento || undefined,
      bairro: form.bairro || undefined,
      cep: form.cep || undefined,
      municipio: form.municipioCodigo ? { codigo: Number(form.municipioCodigo) } : undefined,
    },
  };

  if (!omitirIdentidade) {
    dadosPessoais.nome = form.nome;
    dadosPessoais.sobrenome = form.sobrenome;
    dadosPessoais.cpf = form.cpf;
  }

  return {
    tipo: form.tipo,
    numeroRegistroConselho: form.numeroRegistroConselho || undefined,
    especialidade: form.especialidade || undefined,
    dadosPessoais,
  };
}

// props:
// - valoresIniciais: parcial do estado do form (pré-preenchimento no modo edição)
// - bloquearIdentidade: desabilita nome/sobrenome/cpf (RN: não editáveis após o cadastro)
// - rotuloBotao: texto do botão de envio
// - enviar(payload): função assíncrona que faz o POST/PUT de fato
// - aoSucesso(resultado): callback opcional pra efeitos específicos da tela (link, navegação)
// - resetarAoSalvar: limpa o formulário após sucesso (uso típico: tela de cadastro)
export function ProfissionalFormulario({ valoresIniciais, bloquearIdentidade, rotuloBotao, enviar, aoSucesso, resetarAoSalvar }) {
  const { sessao } = useAuth();
  const [form, setForm] = useState({ ...FORM_VAZIO, ...valoresIniciais });
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    requisitar('/estado', { token: sessao.token })
      .then(setEstados)
      .catch((excecao) => setErro(excecao.message));
  }, [sessao.token]);

  useEffect(() => {
    if (!form.estadoSigla) {
      setMunicipios([]);
      return;
    }
    requisitar(`/municipio?uf=${form.estadoSigla}`, { token: sessao.token })
      .then(setMunicipios)
      .catch((excecao) => setErro(excecao.message));
  }, [form.estadoSigla, sessao.token]);

  function atualizarCampo(campo) {
    return (evento) => setForm((atual) => ({ ...atual, [campo]: evento.target.value }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);

    try {
      const resultado = await enviar(montarPayloadProfissional(form, { omitirIdentidade: bloquearIdentidade }));
      setSucesso(resultado);
      if (resetarAoSalvar) {
        setForm({ ...FORM_VAZIO, ...valoresIniciais });
        setMunicipios([]);
      }
      aoSucesso?.(resultado);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={aoSubmeter}>
      <Secao titulo="Dados profissionais">
        <Campo rotulo="Tipo" obrigatorio>
          <select value={form.tipo} onChange={atualizarCampo('tipo')} required className={CAMPO_CLASSES}>
            {TIPOS_PROFISSIONAL.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Número de registro (CRM/COREN/CNH)">
          <input value={form.numeroRegistroConselho} onChange={atualizarCampo('numeroRegistroConselho')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Especialidade">
          <input value={form.especialidade} onChange={atualizarCampo('especialidade')} className={CAMPO_CLASSES} />
        </Campo>
      </Secao>

      <Secao titulo="Dados pessoais">
        <Campo rotulo="Nome" obrigatorio>
          <input
            value={form.nome}
            onChange={atualizarCampo('nome')}
            required
            disabled={bloquearIdentidade}
            title={bloquearIdentidade ? 'Nome não pode ser alterado após o cadastro' : undefined}
            className={CAMPO_CLASSES}
          />
        </Campo>

        <Campo rotulo="Sobrenome" obrigatorio>
          <input
            value={form.sobrenome}
            onChange={atualizarCampo('sobrenome')}
            required
            disabled={bloquearIdentidade}
            title={bloquearIdentidade ? 'Sobrenome não pode ser alterado após o cadastro' : undefined}
            className={CAMPO_CLASSES}
          />
        </Campo>

        <Campo rotulo="Data de nascimento" obrigatorio>
          <input
            placeholder="DD/MM/AAAA"
            value={form.dataNascimento}
            onChange={atualizarCampo('dataNascimento')}
            required
            className={CAMPO_CLASSES}
          />
        </Campo>

        <Campo rotulo="CPF" obrigatorio>
          <input
            value={form.cpf}
            onChange={atualizarCampo('cpf')}
            required
            maxLength={11}
            placeholder="Somente números"
            disabled={bloquearIdentidade}
            title={bloquearIdentidade ? 'CPF não pode ser alterado após o cadastro' : undefined}
            className={CAMPO_CLASSES}
          />
        </Campo>

        <Campo rotulo="Sexo">
          <select value={form.sexo} onChange={atualizarCampo('sexo')} className={CAMPO_CLASSES}>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </Campo>

        <Campo rotulo="E-mail">
          <input type="email" value={form.email} onChange={atualizarCampo('email')} className={CAMPO_CLASSES} />
        </Campo>
      </Secao>

      <Secao titulo="Endereço">
        <Campo rotulo="Logradouro">
          <input value={form.logradouro} onChange={atualizarCampo('logradouro')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Número">
          <input value={form.numero} onChange={atualizarCampo('numero')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Complemento">
          <input value={form.complemento} onChange={atualizarCampo('complemento')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Bairro">
          <input value={form.bairro} onChange={atualizarCampo('bairro')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="CEP">
          <input value={form.cep} onChange={atualizarCampo('cep')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Estado">
          <select value={form.estadoSigla} onChange={atualizarCampo('estadoSigla')} className={CAMPO_CLASSES}>
            <option value="">Selecione</option>
            {estados.map((estado) => (
              <option key={estado.codigo} value={estado.sigla}>
                {estado.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Município">
          <select
            value={form.municipioCodigo}
            onChange={atualizarCampo('municipioCodigo')}
            disabled={!form.estadoSigla}
            className={CAMPO_CLASSES}
          >
            <option value="">Selecione</option>
            {municipios.map((municipio) => (
              <option key={municipio.codigo} value={municipio.codigo}>
                {municipio.nome}
              </option>
            ))}
          </select>
        </Campo>
      </Secao>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {sucesso && (
        <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">
          Salvo com sucesso. Código: {sucesso.codigo}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Enviando...' : rotuloBotao}
      </button>
    </form>
  );
}
