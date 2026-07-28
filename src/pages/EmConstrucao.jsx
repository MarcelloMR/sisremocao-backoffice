import { Construction } from 'lucide-react';

export function EmConstrucao({ titulo }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-chumbo">{titulo}</h1>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-text-secundario/30 bg-bg-card py-20 text-center">
        <Construction className="size-8 text-text-secundario" strokeWidth={1.5} />
        <p className="text-sm font-medium text-text-secundario">Esta seção ainda não foi implementada.</p>
      </div>
    </div>
  );
}
