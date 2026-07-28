import { TabelaAmbulancias } from '../components/TabelaAmbulancias.jsx';

export function SelecionarAmbulanciaParaRemover() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Remover Ambulância</h1>
        <p className="mt-1 text-sm text-text-secundario">Busque a ambulância e clique em "Remover" para desativar o cadastro.</p>
      </div>
      <TabelaAmbulancias comFiltros mostrarDetalhar={false} mostrarEditar={false} mostrarRemover />
    </div>
  );
}
