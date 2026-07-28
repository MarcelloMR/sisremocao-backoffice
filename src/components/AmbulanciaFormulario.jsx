import { useEffect, useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';

const STATUS_AMBULANCIA = ['Disponivel', 'Ocupada', 'Revisao_Oficina', 'Alugada'];

const FORM_VAZIO = {
  status: 'Disponivel',
  numeroIdentificacao: '',
  utiMovel: false,
  modelo: '',
  fabricante: '',
  ano: '',
  anoModelo: '',
  anoAquisicao: '',
  quilometragemMarcador: '',
  placaIdentificador: '',
  chassi: '',
  estadoSigla: '',
  municipioCodigo: '',
};

export function montarPayloadAmbulancia(form) {
  return {
    status: form.status,
    numeroIdentificacao: form.numeroIdentificacao ? Number(form.numeroIdentificacao) : undefined,
    utiMovel: form.utiMovel,
    carro: {
      modelo: form.modelo,
      fabricante: form.fabricante,
      ano: form.ano ? Number(form.ano) : undefined,
      anoModelo: form.anoModelo ? Number(form.anoModelo) : undefined,
      anoAquisicao: form.anoAquisicao ? Number(form.anoAquisicao) : undefined,
      quilometragemMarcador: form.quilometragemMarcador ? Number(form.quilometragemMarcador) : undefined,
      placaIdentificador: form.placaIdentificador ? form.placaIdentificador.toUpperCase() : undefined,
      chassi: form.chassi || undefined,
      municipio: form.municipioCodigo ? { codigo: Number(form.municipioCodigo) } : undefined,
    },
  };
}

// props:
// - valoresIniciais: parcial do estado do form (pré-preenchimento no modo edição)
// - rotuloBotao: texto do botão de envio
// - enviar(payload): função assíncrona que faz o POST/PUT de fato
// - aoSucesso(resultado): callback opcional pra efeitos específicos da tela
// - resetarAoSalvar: limpa o formulário após sucesso (uso típico: tela de cadastro)
export function AmbulanciaFormulario({ valoresIniciais, rotuloBotao, enviar, aoSucesso, resetarAoSalvar }) {
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
    return (evento) => {
      const valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value;
      setForm((atual) => ({ ...atual, [campo]: valor }));
    };
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);

    try {
      const resultado = await enviar(montarPayloadAmbulancia(form));
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
      <Secao titulo="Dados da ambulância">
        <Campo rotulo="Status" obrigatorio>
          <select value={form.status} onChange={atualizarCampo('status')} required className={CAMPO_CLASSES}>
            {STATUS_AMBULANCIA.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Número de identificação">
          <input value={form.numeroIdentificacao} onChange={atualizarCampo('numeroIdentificacao')} className={CAMPO_CLASSES} />
        </Campo>

        <label className="flex items-center gap-2 text-sm font-medium text-text-principal">
          <input type="checkbox" checked={form.utiMovel} onChange={atualizarCampo('utiMovel')} className="size-4" />
          UTI Móvel (exige médico na equipe)
        </label>
      </Secao>

      <Secao titulo="Dados do veículo">
        <Campo rotulo="Modelo" obrigatorio>
          <input value={form.modelo} onChange={atualizarCampo('modelo')} required className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Fabricante" obrigatorio>
          <input value={form.fabricante} onChange={atualizarCampo('fabricante')} required className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Ano" obrigatorio>
          <input value={form.ano} onChange={atualizarCampo('ano')} required className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Ano modelo">
          <input value={form.anoModelo} onChange={atualizarCampo('anoModelo')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Ano de aquisição">
          <input value={form.anoAquisicao} onChange={atualizarCampo('anoAquisicao')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Quilometragem">
          <input value={form.quilometragemMarcador} onChange={atualizarCampo('quilometragemMarcador')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Placa" obrigatorio>
          <input
            value={form.placaIdentificador}
            onChange={atualizarCampo('placaIdentificador')}
            required
            maxLength={7}
            placeholder="ABC1234"
            className={CAMPO_CLASSES}
          />
        </Campo>

        <Campo rotulo="Chassi">
          <input value={form.chassi} onChange={atualizarCampo('chassi')} className={CAMPO_CLASSES} />
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
