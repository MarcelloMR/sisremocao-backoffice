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

// No cadastro o status não é enviado: toda ambulância nasce Disponivel (regra da API) e só pode
// ser ajustada depois, na tela de atualização.
export function montarPayloadAmbulancia(form, { edicao = false } = {}) {
  return {
    status: edicao ? form.status : undefined,
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
// - edicao: tela de atualização — mostra o campo Status e não exige reinformar o município
export function AmbulanciaFormulario({ valoresIniciais, rotuloBotao, enviar, aoSucesso, resetarAoSalvar, edicao = false }) {
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
      const resultado = await enviar(montarPayloadAmbulancia(form, { edicao }));
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
        {edicao && (
          <Campo rotulo="Status" obrigatorio>
            <select value={form.status} onChange={atualizarCampo('status')} required className={CAMPO_CLASSES}>
              {STATUS_AMBULANCIA.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <Campo rotulo="Número de identificação">
          <input
            value={form.numeroIdentificacao}
            onChange={atualizarCampo('numeroIdentificacao')}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={edicao ? undefined : 'Gerado automaticamente se ficar em branco'}
            className={CAMPO_CLASSES}
          />
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
            pattern="[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}"
            title="Padrão antigo (ABC1234) ou Mercosul (ABC1D23), sem hífen"
            placeholder="ABC1234 ou ABC1D23"
            className={CAMPO_CLASSES}
          />
        </Campo>

        <Campo rotulo="Chassi">
          <input value={form.chassi} onChange={atualizarCampo('chassi')} className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Estado" obrigatorio={!edicao}>
          <select value={form.estadoSigla} onChange={atualizarCampo('estadoSigla')} required={!edicao} className={CAMPO_CLASSES}>
            <option value="">Selecione</option>
            {estados.map((estado) => (
              <option key={estado.codigo} value={estado.sigla}>
                {estado.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Município" obrigatorio={!edicao}>
          <select
            value={form.municipioCodigo}
            onChange={atualizarCampo('municipioCodigo')}
            disabled={!form.estadoSigla}
            required={!edicao}
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
          {sucesso.numeroIdentificacao != null && ` — Número de identificação: ${sucesso.numeroIdentificacao}`}
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
