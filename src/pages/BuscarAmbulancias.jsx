import { TabelaAmbulancias } from '../components/TabelaAmbulancias.jsx';

export function BuscarAmbulancias() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Buscar Ambulâncias</h1>
        <p className="mt-1 text-sm text-text-secundario">Filtre por status e/ou disponibilidade para localizar uma ambulância.</p>
      </div>
      <TabelaAmbulancias comFiltros mostrarDetalhar mostrarEditar mostrarRemover />
    </div>
  );
}
