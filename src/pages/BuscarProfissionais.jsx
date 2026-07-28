import { TabelaProfissionais } from '../components/TabelaProfissionais.jsx';

export function BuscarProfissionais() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Buscar Profissionais</h1>
        <p className="mt-1 text-sm text-text-secundario">Filtre por nome e/ou tipo para localizar um profissional.</p>
      </div>
      <TabelaProfissionais comFiltros mostrarEditar mostrarRemover />
    </div>
  );
}
