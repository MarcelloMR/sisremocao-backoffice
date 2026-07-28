import { TabelaAmbulancias } from '../components/TabelaAmbulancias.jsx';

export function ListarAmbulancias() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Ambulâncias</h1>
        <p className="mt-1 text-sm text-text-secundario">Todas as ambulâncias ativas cadastradas no sistema.</p>
      </div>
      <TabelaAmbulancias comFiltros mostrarEditar mostrarRemover />
    </div>
  );
}
