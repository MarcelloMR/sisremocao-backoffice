import { CircleCheck, CircleX } from 'lucide-react';
import { descreverResultado } from './auditoriaFormato.js';

// O resultado é sempre legível pelo texto ("Sucesso" / "Recusado (403)"); ícone e cor só reforçam.
export function ResultadoAuditoria({ item }) {
  const Icone = item.sucesso ? CircleCheck : CircleX;
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${item.sucesso ? 'text-azul-petroleo' : 'text-vermelho'}`}>
      <Icone className="size-4 shrink-0" aria-hidden="true" />
      {descreverResultado(item)}
    </span>
  );
}
