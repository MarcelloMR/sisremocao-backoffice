export const CAMPO_CLASSES =
  'rounded-lg border border-text-secundario/30 px-3 py-2 text-base font-normal text-text-principal sm:text-sm outline-none focus:border-azul-petroleo focus:ring-1 focus:ring-azul-petroleo disabled:cursor-not-allowed disabled:opacity-50';

// Padrão do sistema para o nome de um campo: o asterisco vermelho de obrigatório fica na mesma
// linha, logo depois do nome. Fica num <span> próprio porque o <label> que o envolve costuma ser
// flex-col — solto ali, o asterisco caía para a linha de baixo e desalinhava os campos vizinhos.
export function RotuloCampo({ rotulo, obrigatorio }) {
  return (
    <span>
      {rotulo}
      {obrigatorio && <span className="text-vermelho"> *</span>}
    </span>
  );
}

export function Campo({ rotulo, obrigatorio, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-text-principal">
      <RotuloCampo rotulo={rotulo} obrigatorio={obrigatorio} />
      {children}
    </label>
  );
}

export function Secao({ titulo, children }) {
  return (
    <section className="rounded-xl bg-bg-card p-6 shadow-sm">
      <h2 className="mb-5 text-sm font-bold text-chumbo uppercase tracking-wide">{titulo}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
