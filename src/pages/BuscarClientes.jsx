import { TabelaClientes } from '../components/TabelaClientes.jsx';

export function BuscarClientes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Buscar Clientes</h1>
        <p className="mt-1 text-sm text-text-secundario">Filtre por UF para localizar um cliente.</p>
      </div>
      <TabelaClientes comFiltros />
    </div>
  );
}
