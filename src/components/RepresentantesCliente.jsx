import { useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';

const FORM_VAZIO = { nome: '', sobrenome: '', dataNascimento: '', cpf: '', email: '', telefone: '' };

// props:
// - clienteId: código do cliente ao qual os representantes pertencem
// - representantes: lista atual (vem de cliente.consultar)
// - aoAdicionar(): callback pra recarregar a lista após adicionar
export function RepresentantesCliente({ clienteId, representantes, aoAdicionar }) {
  const { sessao } = useAuth();
  const [form, setForm] = useState(FORM_VAZIO);
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
    setEnviando(true);

    try {
      // Rota é POST /cliente/:codigo (mesmo path do PUT que atualiza o cliente; só o verbo muda) —
      // decisão consciente documentada em services/index.js no backend.
      const resultado = await requisitar(`/cliente/${clienteId}`, {
        method: 'POST',
        body: {
          nome: form.nome,
          sobrenome: form.sobrenome,
          dataNascimento: form.dataNascimento,
          cpf: form.cpf || undefined,
          email: form.email || undefined,
          telefone: form.telefone ? { numero: form.telefone } : undefined,
        },
        token: sessao.token,
      });
      setSucesso(
        resultado.contaCriada
          ? 'Representante cadastrado. Um convite de acesso foi enviado por e-mail.'
          : 'Representante cadastrado sem acesso ao sistema (informe um e-mail para liberar login).'
      );
      setForm(FORM_VAZIO);
      aoAdicionar?.();
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-xl bg-bg-card p-6 shadow-sm">
      <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">Representantes</h2>

      {representantes.length > 0 ? (
        <ul className="mb-5 flex flex-col gap-2">
          {representantes.map((representante) => (
            <li key={representante.codigo} className="text-sm text-text-principal">
              {representante.nome} {representante.sobrenome}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-5 text-sm text-text-secundario">Nenhum representante cadastrado ainda.</p>
      )}

      <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
        <Secao titulo="Adicionar representante">
          <Campo rotulo="Nome" obrigatorio>
            <input value={form.nome} onChange={atualizarCampo('nome')} required className={CAMPO_CLASSES} />
          </Campo>
          <Campo rotulo="Sobrenome" obrigatorio>
            <input value={form.sobrenome} onChange={atualizarCampo('sobrenome')} required className={CAMPO_CLASSES} />
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
          <Campo rotulo="CPF">
            <input value={form.cpf} onChange={atualizarCampo('cpf')} maxLength={11} placeholder="Somente números" className={CAMPO_CLASSES} />
          </Campo>
          <Campo rotulo="E-mail">
            <input type="email" value={form.email} onChange={atualizarCampo('email')} className={CAMPO_CLASSES} />
          </Campo>
          <Campo rotulo="Telefone">
            <input value={form.telefone} onChange={atualizarCampo('telefone')} className={CAMPO_CLASSES} />
          </Campo>
        </Secao>

        {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
        {sucesso && <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">{sucesso}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Adicionando...' : 'Adicionar representante'}
        </button>
      </form>
    </section>
  );
}
