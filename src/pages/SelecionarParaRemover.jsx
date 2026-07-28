import { TabelaProfissionais } from '../components/TabelaProfissionais.jsx';

export function SelecionarParaRemover() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Remover Profissional</h1>
        <p className="mt-1 text-sm text-text-secundario">Busque o profissional e clique em "Remover" para desativar o cadastro.</p>
      </div>
      <TabelaProfissionais comFiltros mostrarEditar={false} mostrarRemover />
    </div>
  );
}
