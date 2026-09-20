import { useState } from 'react';
import { Campo, Secao, CAMPO_CLASSES } from './CampoFormulario.jsx';

const FORM_VAZIO = { nome: '', sobrenome: '', email: '', tambemRegulador: false, tambemAdmin: false };

// enviar(payload): função assíncrona que faz o POST de fato (chama a rota /profissional).
export function ConvidarProfissionalFormulario({ enviar, aoSucesso }) {
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function atualizarCampo(campo) {
    return (evento) => setForm((atual) => ({ ...atual, [campo]: evento.target.value }));
  }

  function atualizarCheckbox(campo) {
    return (evento) => setForm((atual) => ({ ...atual, [campo]: evento.target.checked }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);

    try {
      const resultado = await enviar(form);
      setSucesso(resultado);
      setForm(FORM_VAZIO);
      aoSucesso?.(resultado);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={aoSubmeter}>
      <Secao titulo="Convite">
        <Campo rotulo="Nome" obrigatorio>
          <input value={form.nome} onChange={atualizarCampo('nome')} required className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="Sobrenome" obrigatorio>
          <input value={form.sobrenome} onChange={atualizarCampo('sobrenome')} required className={CAMPO_CLASSES} />
        </Campo>

        <Campo rotulo="E-mail" obrigatorio>
          <input type="email" value={form.email} onChange={atualizarCampo('email')} required className={CAMPO_CLASSES} />
        </Campo>
      </Secao>

      <Secao titulo="Papéis adicionais (opcional)">
        <label className="flex items-center gap-2 text-sm font-medium text-text-principal">
          <input type="checkbox" checked={form.tambemRegulador} onChange={atualizarCheckbox('tambemRegulador')} />
          Também é Regulador
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-text-principal">
          <input type="checkbox" checked={form.tambemAdmin} onChange={atualizarCheckbox('tambemAdmin')} />
          Também é Administrador
        </label>
      </Secao>

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {sucesso && (
        <p className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">
          Convite enviado. Código: {sucesso.codigo}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-lg bg-chumbo px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Enviando...' : 'Enviar convite'}
      </button>
    </form>
  );
}
