import { useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';
import { BuscaEndereco } from './BuscaEndereco.jsx';

const TIPOS_REMOCAO = ['Privada', 'Contrato'];

const FORM_VAZIO = {
  tipo: 'Contrato',
  clienteAnonimoNome: '',
  clienteAnonimoTelefone: '',
};

async function criarEndereco(sugestao, token) {
  return requisitar('/endereco', {
    method: 'POST',
    body: {
      logradouro: sugestao.logradouro,
      numero: sugestao.numero,
      bairro: sugestao.bairro,
      cep: sugestao.cep,
      municipioNome: sugestao.municipioNome,
      ufNomeCompleto: sugestao.ufNomeCompleto,
    },
    token,
  });
}

// props:
// - enviar(payload): função assíncrona que faz o POST de fato
// - aoSucesso(resultado): callback opcional
export function RemocaoFormulario({ enviar, aoSucesso }) {
  const { sessao } = useAuth();
  const ehCliente = sessao.usuario.papel === 'Cliente';
  const [form, setForm] = useState(FORM_VAZIO);
  const [origem, setOrigem] = useState(null);
  const [destino, setDestino] = useState(null);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function atualizarCampo(campo) {
    return (evento) => setForm((atual) => ({ ...atual, [campo]: evento.target.value }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!origem || !destino) {
      setErro('Selecione origem e destino a partir das sugestões de busca.');
      return;
    }

    setEnviando(true);
    try {
      const [enderecoOrigem, enderecoDestino] = await Promise.all([
        criarEndereco(origem, sessao.token),
        criarEndereco(destino, sessao.token),
      ]);

      const payload = {
        status: 'Solicitada',
        tipo: form.tipo,
        origem: { endereco: { codigo: enderecoOrigem.codigo } },
        destino: { endereco: { codigo: enderecoDestino.codigo } },
      };

      if (!ehCliente) {
        payload.clienteAnonimo = {
          nome: form.clienteAnonimoNome,
          telefone: form.clienteAnonimoTelefone,
        };
      }

      const resultado = await enviar(payload);
      setSucesso(resultado);
      setForm(FORM_VAZIO);
      setOrigem(null);
      setDestino(null);
      aoSucesso?.(resultado);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={aoSubmeter}>
      <Secao titulo="Dados da remoção">
        <Campo rotulo="Tipo" obrigatorio>
          <select value={form.tipo} onChange={atualizarCampo('tipo')} required className={CAMPO_CLASSES}>
            {TIPOS_REMOCAO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </Campo>
      </Secao>

      {!ehCliente && (
        <Secao titulo="Cliente (solicitação avulsa, sem cadastro)">
          <Campo rotulo="Nome" obrigatorio>
            <input
              value={form.clienteAnonimoNome}
              onChange={atualizarCampo('clienteAnonimoNome')}
              required
              className={CAMPO_CLASSES}
            />
          </Campo>
          <Campo rotulo="Telefone" obrigatorio>
            <input
              value={form.clienteAnonimoTelefone}
              onChange={atualizarCampo('clienteAnonimoTelefone')}
              required
              className={CAMPO_CLASSES}
            />
          </Campo>
        </Secao>
      )}

      <section className="rounded-xl bg-bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Origem e destino</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BuscaEndereco rotulo="Origem" valor={origem} aoSelecionar={setOrigem} />
          <BuscaEndereco rotulo="Destino" valor={destino} aoSelecionar={setDestino} />
        </div>
      </section>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {sucesso && (
        <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">
          Solicitação registrada com sucesso. Código: {sucesso.codigo}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Enviando...' : 'Solicitar Remoção'}
      </button>
    </form>
  );
}
