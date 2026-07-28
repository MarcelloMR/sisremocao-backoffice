import { TabelaRemocoes } from '../components/TabelaRemocoes.jsx';

export function BuscarRemocoes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Buscar Remoções</h1>
        <p className="mt-1 text-sm text-text-secundario">Filtre por status para localizar uma remoção.</p>
      </div>
      <TabelaRemocoes comFiltros mostrarAlocar />
    </div>
  );
}
