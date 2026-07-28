import { TabelaAmbulancias } from '../components/TabelaAmbulancias.jsx';

export function SelecionarAmbulanciaParaAtualizar() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Atualizar Ambulância</h1>
        <p className="mt-1 text-sm text-text-secundario">Busque a ambulância e clique em "Editar" para atualizar os dados.</p>
      </div>
      <TabelaAmbulancias comFiltros mostrarDetalhar={false} mostrarEditar mostrarRemover={false} />
    </div>
  );
}
