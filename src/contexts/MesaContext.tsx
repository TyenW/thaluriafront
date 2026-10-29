import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Mesa, PainelMesas } from '../types/mesa';
import { mesasService } from '../services/mesasService';
import { useEstadoPersistido } from '../hooks/useEstadoPersistido';

interface MesaContextValue {
  painel: PainelMesas | null;
  /** Mesa escolhida no painel do Mestre; vai em todas as chamadas de comércio e conhecimento. */
  mesa: Mesa | null;
  mesaId: number | null;
  escolherMesa: (id: number | null) => void;
  /** Recarrega mesas e relógios (depois de avançar o tempo ou trocar personagens). */
  recarregar: () => Promise<void>;
  /** Atualiza o painel com um que o servidor já devolveu. */
  aplicarPainel: (p: PainelMesas) => void;
  erro: string | null;
}

const MesaContext = createContext<MesaContextValue | null>(null);

/** Mesas do Mestre: qual está escolhida (lembrada no navegador) e os relógios de todas. */
export const MesaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [painel, setPainel] = useState<PainelMesas | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mesaSalva, setMesaSalva] = useEstadoPersistido<number | null>('mestre:mesa', null);

  const recarregar = useCallback(async () => {
    try {
      setPainel(await mesasService.painel());
      setErro(null);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível carregar as mesas.');
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Mesa lembrada que sumiu ou foi arquivada: cai para a primeira ativa
  const mesa = useMemo(() => {
    if (!painel) return null;
    const ativas = painel.mesas.filter((m) => m.status === 'ATIVA');
    return painel.mesas.find((m) => m.id === mesaSalva && m.status === 'ATIVA') ?? ativas[0] ?? null;
  }, [painel, mesaSalva]);

  const valor = useMemo<MesaContextValue>(
    () => ({ painel, mesa, mesaId: mesa?.id ?? null, escolherMesa: setMesaSalva, recarregar, aplicarPainel: setPainel, erro }),
    [painel, mesa, setMesaSalva, recarregar, erro]
  );

  return <MesaContext.Provider value={valor}>{children}</MesaContext.Provider>;
};

export function useMesa(): MesaContextValue {
  const ctx = useContext(MesaContext);
  if (!ctx) throw new Error('useMesa precisa estar dentro de MesaProvider (MasterLayout).');
  return ctx;
}
