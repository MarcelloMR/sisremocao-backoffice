import { TabelaProfissionais } from '../components/TabelaProfissionais.jsx';

export function SelecionarParaAtualizar() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Atualizar Profissional</h1>
        <p className="mt-1 text-sm text-text-secundario">Busque o profissional e clique em "Editar" para atualizar os dados.</p>
      </div>
      <TabelaProfissionais comFiltros mostrarEditar mostrarRemover={false} />
    </div>
  );
}
