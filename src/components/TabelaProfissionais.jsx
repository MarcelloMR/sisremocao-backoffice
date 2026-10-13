import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPO_CLASSES } from './CampoFormulario.jsx';

const TIPOS_PROFISSIONAL = ['Medico', 'Enfermeiro', 'Motorista', 'Tecnico_Enfermagem'];

const ROTULO_PAPEL = { regulador: 'Regulador', admin: 'Admin' };

// props:
// - comFiltros: mostra campos de busca (nome/tipo) acima da tabela
// - mostrarEditar / mostrarRemover: quais ações aparecem por linha
//
// Só o Admin gere profissionais: as colunas Regulador e Admin (papéis que o profissional acumula) e
// as ações Editar/Remover/Reenviar convite existem apenas para ele. "Reenviar convite" aparece só
// para quem ainda não fez o primeiro acesso (convitePendente), nas telas que mostram Editar. Para o Regulador a tabela é só consulta, sem
// nenhuma indicação de quem tem papel administrativo — a API nem envia essa informação a ele.
export function TabelaProfissionais({ comFiltros = true, mostrarEditar = true, mostrarRemover = true }) {
  const { sessao } = useAuth();
  const ehAdmin = Boolean(sessao.usuario.papeis?.includes('Admin'));
  const exibirEditar = mostrarEditar && ehAdmin;
  const exibirRemover = mostrarRemover && ehAdmin;
  const totalColunas = 3 + (ehAdmin ? 2 : 0) + (exibirEditar || exibirRemover ? 1 : 0);
  const [salvandoPapel, setSalvandoPapel] = useState(null);
  const [reenviando, setReenviando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const parametros = new URLSearchParams();
      if (nome) parametros.set('nome', nome);
      if (tipo) parametros.set('tipo', tipo);
      const resposta = await requisitar(`/profissional?${parametros.toString()}`, { token: sessao.token });
      setProfissionais(resposta);
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // papel: 'regulador' | 'admin'. Confirma antes, porque um clique concede (ou retira) acesso amplo.
  async function alterarPapel(profissional, papel, conceder) {
    const nomeCompleto = `${profissional.dadosPessoais.nome} ${profissional.dadosPessoais.sobrenome}`;
    const pergunta = conceder
      ? `Conceder o papel ${ROTULO_PAPEL[papel]} a ${nomeCompleto}?`
      : `Retirar o papel ${ROTULO_PAPEL[papel]} de ${nomeCompleto}?`;
    if (!window.confirm(pergunta)) {
      return;
    }

    setErro(null);
    setSalvandoPapel(`${profissional.codigo}:${papel}`);
    try {
      const resposta = await requisitar(`/profissional/${profissional.codigo}/papeis`, {
        method: 'PUT',
        body: { [papel]: conceder },
        token: sessao.token,
      });
      setProfissionais((atuais) =>
        atuais.map((item) =>
          item.codigo === profissional.codigo ? { ...item, ehRegulador: resposta.ehRegulador, ehAdmin: resposta.ehAdmin } : item
        )
      );
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setSalvandoPapel(null);
    }
  }

  // Confirma antes: refazer o convite invalida o código e a senha temporária do convite anterior.
  async function reenviarConvite(profissional) {
    const nomeCompleto = `${profissional.dadosPessoais.nome} ${profissional.dadosPessoais.sobrenome}`;
    const destino = profissional.dadosPessoais.email ? ` para ${profissional.dadosPessoais.email}` : '';
    if (!window.confirm(`Reenviar o convite de acesso de ${nomeCompleto}${destino}?\n\nO código e a senha temporária do convite anterior deixam de valer.`)) {
      return;
    }

    setErro(null);
    setAviso(null);
    setReenviando(profissional.codigo);
    try {
      const resposta = await requisitar(`/profissional/${profissional.codigo}/reenviar-convite`, { method: 'POST', token: sessao.token });
      setProfissionais((atuais) => atuais.map((item) => (item.codigo === profissional.codigo ? { ...item, temConta: true } : item)));
      if (resposta.emailEnviado) {
        setAviso(`Convite reenviado para ${resposta.email}. O código e a senha anteriores deixaram de valer.`);
      } else {
        setErro(`O convite de ${nomeCompleto} foi refeito, mas o e-mail para ${resposta.email} não pôde ser enviado. Tente reenviar de novo em alguns minutos.`);
      }
    } catch (excecao) {
      setErro(excecao.cause || excecao.message);
    } finally {
      setReenviando(null);
    }
  }

  function caixaPapel(profissional, papel, marcado) {
    return (
      <input
        type="checkbox"
        checked={Boolean(marcado)}
        disabled={!profissional.temConta || salvandoPapel !== null}
        onChange={(evento) => alterarPapel(profissional, papel, evento.target.checked)}
        aria-label={`${ROTULO_PAPEL[papel]}: ${profissional.dadosPessoais.nome} ${profissional.dadosPessoais.sobrenome}`}
        title={profissional.temConta ? undefined : 'Profissional sem conta de acesso'}
        className="size-4 disabled:cursor-not-allowed"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {comFiltros && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            buscar();
          }}
          className="grid grid-cols-1 gap-3 rounded-xl bg-bg-card p-4 shadow-sm sm:flex sm:flex-wrap sm:items-end"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO_CLASSES} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={CAMPO_CLASSES}>
              <option value="">Todos</option>
              {TIPOS_PROFISSIONAL.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-chumbo px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-chumbo/90"
          >
            Buscar
          </button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-vermelho/10 px-4 py-3 text-sm font-medium text-vermelho">{erro}</p>}
      {aviso && (
        <p role="status" className="rounded-lg bg-azul-petroleo/10 px-4 py-3 text-sm font-medium text-azul-petroleo">
          {aviso}
        </p>
      )}

      <div className="tabela-cartoes-moldura overflow-x-auto rounded-xl bg-bg-card shadow-sm">
        <table className="tabela-cartoes w-full text-sm">
          <thead>
            <tr className="bg-azul-petroleo text-left text-white">
              <th className="px-5 py-3 font-bold">Nome</th>
              <th className="px-5 py-3 font-bold">Tipo</th>
              <th className="px-5 py-3 font-bold">E-mail</th>
              {ehAdmin && <th className="px-5 py-3 text-center font-bold">Regulador</th>}
              {ehAdmin && <th className="px-5 py-3 text-center font-bold">Admin</th>}
              {(exibirEditar || exibirRemover) && <th className="px-5 py-3 font-bold">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {!carregando && profissionais.length === 0 && (
              <tr className="linha-vazia">
                <td colSpan={totalColunas} className="px-5 py-8 text-center text-sm font-medium text-text-secundario">
                  Nenhum profissional encontrado.
                </td>
              </tr>
            )}
            {profissionais.map((profissional) => (
              <tr key={profissional.codigo} className="border-t border-text-secundario/10">
                <td className="celula-titulo px-5 py-3 font-medium text-text-principal">
                  {profissional.dadosPessoais.nome} {profissional.dadosPessoais.sobrenome}
                </td>
                <td data-rotulo="Tipo" className="px-5 py-3 text-text-principal">
                  {profissional.tipo ? (
                    profissional.tipo.replace('_', ' ')
                  ) : (
                    <span className="italic text-text-secundario">Cadastro pendente</span>
                  )}
                </td>
                <td data-rotulo="E-mail" className="px-5 py-3 text-text-secundario">{profissional.dadosPessoais.email || '—'}</td>
                {ehAdmin && <td data-rotulo="Regulador" className="px-5 py-3 text-center">{caixaPapel(profissional, 'regulador', profissional.ehRegulador)}</td>}
                {ehAdmin && <td data-rotulo="Admin" className="px-5 py-3 text-center">{caixaPapel(profissional, 'admin', profissional.ehAdmin)}</td>}
                {(exibirEditar || exibirRemover) && (
                  <td className="celula-acoes px-5 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 lg:flex-nowrap">
                      {exibirEditar && profissional.convitePendente && (
                        <button
                          type="button"
                          onClick={() => reenviarConvite(profissional)}
                          disabled={reenviando !== null}
                          className="font-medium text-azul-petroleo hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {reenviando === profissional.codigo ? 'Enviando...' : 'Reenviar convite'}
                        </button>
                      )}
                      {exibirEditar && (
                        <Link to={`/profissionais/${profissional.codigo}/editar`} className="font-medium text-azul-petroleo hover:underline">
                          Editar
                        </Link>
                      )}
                      {exibirRemover && (
                        <Link to={`/profissionais/${profissional.codigo}/remover`} className="font-medium text-vermelho hover:underline">
                          Remover
                        </Link>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ehAdmin && profissionais.length > 0 && (
        <p className="text-xs text-text-secundario">
          Alterar Regulador ou Admin vale a partir do próximo login da pessoa.
        </p>
      )}
    </div>
  );
}
