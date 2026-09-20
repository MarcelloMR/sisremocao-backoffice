import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from '../components/CampoFormulario.jsx';

const TIPOS_PROFISSIONAL = ['Medico', 'Enfermeiro', 'Motorista', 'Tecnico_Enfermagem'];

const FORM_VAZIO = {
  tipo: 'Motorista',
  numeroRegistroConselho: '',
  especialidade: '',
  dataNascimento: '',
  cpf: '',
  sexo: 'Masculino',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cep: '',
  estadoSigla: '',
  municipioCodigo: '',
};

// Tela da 2ª etapa do cadastro em 2 etapas: o próprio profissional (já autenticado com a senha
// temporária recebida no convite) completa CPF, documentos, contato e registro profissional.
export function CompletarCadastroProfissional() {
  const { sessao, atualizarUsuario } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState(FORM_VAZIO);
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [erro, setErro] = useState(null);
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
    setEnviando(true);

    try {
      await requisitar('/profissional/me/completar-cadastro', {
        method: 'PUT',
        token: sessao.token,
        body: {
          tipo: form.tipo,
          numeroRegistroConselho: form.numeroRegistroConselho,
          especialidade: form.especialidade || undefined,
          dadosPessoais: {
            cpf: form.cpf,
            dataNascimento: form.dataNascimento,
            sexo: form.sexo,
            endereco: {
              logradouro: form.logradouro || undefined,
              numero: form.numero ? Number(form.numero) : undefined,
              complemento: form.complemento || undefined,
              bairro: form.bairro || undefined,
              cep: form.cep || undefined,
              municipio: form.municipioCodigo ? { codigo: Number(form.municipioCodigo) } : undefined,
            },
          },
        },
      });
      atualizarUsuario({ cadastroIncompleto: false });
      navegar('/');
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Complete seu cadastro</h1>
        <p className="mt-1 text-sm text-text-secundario">
          Informe seus dados profissionais e pessoais para começar a usar o sistema. CPF e registro profissional não poderão ser
          alterados depois.
        </p>
      </div>

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

          <Campo rotulo="Número de registro (CRM/COREN/CNH)" obrigatorio>
            <input value={form.numeroRegistroConselho} onChange={atualizarCampo('numeroRegistroConselho')} required className={CAMPO_CLASSES} />
          </Campo>

          <Campo rotulo="Especialidade">
            <input value={form.especialidade} onChange={atualizarCampo('especialidade')} className={CAMPO_CLASSES} />
          </Campo>
        </Secao>

        <Secao titulo="Documentos e dados pessoais">
          <Campo rotulo="CPF" obrigatorio>
            <input
              value={form.cpf}
              onChange={atualizarCampo('cpf')}
              required
              maxLength={11}
              placeholder="Somente números"
              className={CAMPO_CLASSES}
            />
          </Campo>

          <Campo rotulo="Data de nascimento" obrigatorio>
            <input placeholder="DD/MM/AAAA" value={form.dataNascimento} onChange={atualizarCampo('dataNascimento')} required className={CAMPO_CLASSES} />
          </Campo>

          <Campo rotulo="Sexo">
            <select value={form.sexo} onChange={atualizarCampo('sexo')} className={CAMPO_CLASSES}>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
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
            <select value={form.municipioCodigo} onChange={atualizarCampo('municipioCodigo')} disabled={!form.estadoSigla} className={CAMPO_CLASSES}>
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

        <button
          type="submit"
          disabled={enviando}
          className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Enviando...' : 'Completar cadastro'}
        </button>
      </form>
    </div>
  );
}
