import { TabelaRemocoes } from '../components/TabelaRemocoes.jsx';

export function ListarRemocoes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Remoções</h1>
        <p className="mt-1 text-sm text-text-secundario">Todas as remoções registradas no sistema.</p>
      </div>
      <TabelaRemocoes comFiltros mostrarAlocar />
    </div>
  );
}
