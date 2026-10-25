import React, { useCallback, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface Aviso {
  id: number;
  tipo: 'sucesso' | 'erro';
  texto: string;
}

/** Fila simples de avisos temporários (substitui alert()). */
export function useAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const proximoId = useRef(1);

  const fechar = useCallback((id: number) => {
    setAvisos((lista) => lista.filter((a) => a.id !== id));
  }, []);

  const avisar = useCallback(
    (tipo: Aviso['tipo'], texto: string) => {
      const id = proximoId.current++;
      setAvisos((lista) => [...lista.slice(-2), { id, tipo, texto }]);
      window.setTimeout(() => fechar(id), tipo === 'erro' ? 7000 : 3500);
    },
    [fechar]
  );

  return { avisos, avisar, fechar };
}

export const PainelAvisos: React.FC<{ avisos: Aviso[]; onFechar: (id: number) => void }> = ({ avisos, onFechar }) => (
  <div className="fixed z-[60] bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 space-y-2 pointer-events-none" aria-live="polite">
    {avisos.map((a) => (
      <div
        key={a.id}
        role={a.tipo === 'erro' ? 'alert' : 'status'}
        className={`pointer-events-auto flex items-start gap-2 p-3 rounded-lg border shadow-xl text-xs font-sans-clean animate-fade-in ${
          a.tipo === 'erro'
            ? 'bg-red-950/95 border-red-500/60 text-red-100'
            : 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100'
        }`}
      >
        {a.tipo === 'erro' ? (
          <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
        )}
        <span className="flex-1">{a.texto}</span>
        <button type="button" onClick={() => onFechar(a.id)} className="opacity-70 hover:opacity-100 cursor-pointer" aria-label="Dispensar aviso">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);
