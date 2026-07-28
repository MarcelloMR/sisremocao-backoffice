import { TabelaRemocoes } from '../components/TabelaRemocoes.jsx';

export function ListarMinhasRemocoes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-chumbo">Minhas Remoções</h1>
        <p className="mt-1 text-sm text-text-secundario">Remoções solicitadas pelo seu cliente.</p>
      </div>
      <TabelaRemocoes comFiltros={false} mostrarAlocar={false} />
    </div>
  );
}
