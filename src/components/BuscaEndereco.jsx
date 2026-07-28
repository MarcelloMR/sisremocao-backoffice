import { useEffect, useRef, useState } from 'react';
import { requisitar } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPO_CLASSES } from './CampoFormulario.jsx';

// props:
// - rotulo: texto do label (ex: "Origem", "Destino")
// - valor: objeto endereco selecionado (ou null)
// - aoSelecionar(enderecoEstruturado): callback disparado ao escolher uma sugestão
export function BuscaEndereco({ rotulo, valor, aoSelecionar }) {
  const { sessao } = useAuth();
  const [query, setQuery] = useState(valor?.displayName || '');
  const [sugestoes, setSugestoes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (valor?.displayName) {
      setQuery(valor.displayName);
    }
  }, [valor]);

  function aoDigitar(evento) {
    const texto = evento.target.value;
    setQuery(texto);
    aoSelecionar(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (texto.trim().length < 4) {
      setSugestoes([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      setErro(null);
      try {
        const resultado = await requisitar(`/geocoding/buscar?q=${encodeURIComponent(texto)}`, { token: sessao.token });
        setSugestoes(resultado);
      } catch (excecao) {
        setErro(excecao.cause || excecao.message);
      } finally {
        setBuscando(false);
      }
    }, 400);
  }

  function selecionar(sugestao) {
    setQuery(sugestao.displayName);
    setSugestoes([]);
    aoSelecionar(sugestao);
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-principal">
        {rotulo}
        <span className="text-vermelho"> *</span>
      </label>
      <input
        value={query}
        onChange={aoDigitar}
        placeholder="Digite o endereço..."
        className={CAMPO_CLASSES}
        autoComplete="off"
      />

      {buscando && <p className="text-xs text-text-secundario">Buscando...</p>}
      {erro && <p className="text-xs font-medium text-vermelho">{erro}</p>}

      {sugestoes.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg bg-bg-card shadow-lg">
          {sugestoes.map((sugestao) => (
            <li key={sugestao.displayName}>
              <button
                type="button"
                onClick={() => selecionar(sugestao)}
                className="w-full px-3 py-2 text-left text-sm text-text-principal hover:bg-bg-app"
              >
                {sugestao.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {valor && !valor.municipioResolvido && valor.municipioResolvido !== undefined && (
        <p className="text-xs font-medium text-vermelho">
          Não foi possível identificar o município automaticamente para este endereço.
        </p>
      )}
    </div>
  );
}
