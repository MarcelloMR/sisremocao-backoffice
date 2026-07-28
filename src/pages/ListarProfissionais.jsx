import { TabelaProfissionais } from '../components/TabelaProfissionais.jsx';

export function ListarProfissionais() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Profissionais</h1>
        <p className="mt-1 text-sm text-text-secundario">Todos os profissionais ativos cadastrados no sistema.</p>
      </div>
      <TabelaProfissionais comFiltros={false} mostrarEditar mostrarRemover />
    </div>
  );
}
