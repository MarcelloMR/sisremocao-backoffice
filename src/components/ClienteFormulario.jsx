import { useEffect, useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';

const TIPO_PESSOA_JURIDICA = 1;

const FORM_VAZIO = {
  nomeFantasia: '',
  cnpj: '',
  inicioVigencia: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cep: '',
  estadoSigla: '',
  municipioCodigo: '',
};

export function montarPayloadCliente(form) {
  return {
    tipo: TIPO_PESSOA_JURIDICA,
    nomeFantasia: form.nomeFantasia,
    cnpj: form.cnpj,
    inicioVigencia: form.inicioVigencia,
    endereco: {
      logradouro: form.logradouro || undefined,
      numero: form.numero ? Number(form.numero) : undefined,
      complemento: form.complemento || undefined,
      bairro: form.bairro || undefined,
      cep: form.cep || undefined,
      municipio: form.municipioCodigo ? { codigo: Number(form.municipioCodigo) } : undefined,
    },
  };
}

// props:
// - valoresIniciais: parcial do estado do form (pré-preenchimento no modo edição)
// - rotuloBotao: texto do botão de envio
// - enviar(payload): função assíncrona que faz o POST/PUT de fato
// - aoSucesso(resultado): callback opcional
// - resetarAoSalvar: limpa o formulário após sucesso (uso típico: tela de cadastro)
export function ClienteFormulario({ valoresIniciais, rotuloBotao, enviar, aoSucesso, resetarAoSalvar }) {
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
      const resultado = await enviar(montarPayloadCliente(form));
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
      <Secao titulo="Dados do cliente (pessoa jurídica)">
        <Campo rotulo="Nome fantasia" obrigatorio>
          <input value={form.nomeFantasia} onChange={atualizarCampo('nomeFantasia')} required className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="CNPJ" obrigatorio>
          <input
            value={form.cnpj}
            onChange={atualizarCampo('cnpj')}
            required
            maxLength={14}
            placeholder="Somente números"
            className={CAMPO_CLASSES}
          />
        </Campo>

        <Campo rotulo="Início de vigência" obrigatorio>
          <input
            type="date"
            value={form.inicioVigencia}
            onChange={atualizarCampo('inicioVigencia')}
            required
            className={CAMPO_CLASSES}
          />
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
