import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ArmaCalculada, EscolhaMaterial } from '../../types/forja';
import { forjaService, serializarMateriais } from '../../services/forjaService';
import { corRaridade, formatarLatao, rotuloEnum } from '../../utils/formatadores';

/** Slots extras pela qualidade da oficina (tabela QualidadeCraft: grau = nível da loja). */
export const SLOTS_POR_NIVEL: Record<number, number> = { 1: 0, 2: 1, 3: 1, 4: 2, 5: 2 };

const Numero: React.FC<{ rotulo: string; children: React.ReactNode }> = ({ rotulo, children }) => (
  <div className="rounded-lg bg-abismo border border-linha px-2.5 py-1.5">
    <span className="block text-[10px] font-cinzel uppercase tracking-wider text-nevoa">{rotulo}</span>
    <strong className="block font-mono text-sm text-pergaminho">{children}</strong>
  </div>
);

export interface PreviaArmaProps {
  tipoArmaId: number | null;
  escolhas: EscolhaMaterial[];
  nome?: string;
  /** Nível da oficina que vai forjar: soma os slots da qualidade. */
  nivelLoja?: number;
  onCalculada?: (a: ArmaCalculada | null) => void;
}

/** Números da arma calculados pelo servidor enquanto o Mestre escolhe os materiais. */
export const PreviaArma: React.FC<PreviaArmaProps> = ({ tipoArmaId, escolhas, nome, nivelLoja, onCalculada }) => {
  const [arma, setArma] = useState<ArmaCalculada | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const chave = serializarMateriais(escolhas);

  useEffect(() => {
    if (!tipoArmaId) {
      setArma(null);
      onCalculada?.(null);
      return;
    }
    let ativo = true;
    const t = setTimeout(async () => {
      setCarregando(true);
      try {
        const a = await forjaService.previa(tipoArmaId, escolhas, nome);
        if (!ativo) return;
        setArma(a);
        setErro(null);
        onCalculada?.(a);
      } catch (err: any) {
        if (!ativo) return;
        setErro(err.message || 'Não foi possível calcular.');
        onCalculada?.(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
    // Recalcula só quando tipo, materiais (pela chave) ou nome mudam
  }, [tipoArmaId, chave, nome]);

  if (!tipoArmaId) return <p className="text-xs text-nevoa">Escolha o tipo de arma para ver os números.</p>;
  if (erro) return <p className="text-xs text-red-300">{erro}</p>;
  if (!arma) return <Loader2 className="w-5 h-5 animate-spin text-amber-400" aria-label="Calculando" />;

  const slotsQualidade = nivelLoja ? SLOTS_POR_NIVEL[nivelLoja] ?? 0 : 0;
  return (
    <div className={`space-y-3 transition-opacity ${carregando ? 'opacity-60' : ''}`} aria-live="polite">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Numero rotulo="Dano">{arma.dano}</Numero>
        <Numero rotulo="Durabilidade">{arma.durabilidade}</Numero>
        <Numero rotulo="Peso">{arma.pesoKg.toLocaleString('pt-BR')} kg</Numero>
        <Numero rotulo="Valor">{formatarLatao(arma.precoLatao)}</Numero>
        <Numero rotulo="Raridade">
          <span className={corRaridade(arma.raridade)}>{rotuloEnum(arma.raridade)}</span>
        </Numero>
        {arma.alcanceM > 0 && <Numero rotulo="Alcance">{arma.alcanceM} m</Numero>}
        <Numero rotulo="Slots de efeito">
          {arma.slotsEfeito + slotsQualidade}
          {slotsQualidade > 0 && <span className="text-[10px] text-nevoa"> ({arma.slotsEfeito} + {slotsQualidade} da oficina)</span>}
        </Numero>
        <Numero rotulo="Tempo">{Math.ceil(arma.tempoHoras / 24)} dia(s)</Numero>
      </div>
      {arma.componentes.length > 0 && (
        <ul className="text-[11px] text-texto-2 space-y-0.5">
          {arma.componentes.map((c) => (
            <li key={c.parteId}>
              <span className="text-nevoa">{c.parte}:</span> <span className={corRaridade(c.raridade)}>{c.nome}</span>
              <span className="text-nevoa">
                {' '}
                · +{Math.round(c.bonusDano * 10) / 10} dano · {Math.round(c.durabilidade)} dur.
              </span>
            </li>
          ))}
        </ul>
      )}
      {arma.problemas.length > 0 && (
        <ul className="space-y-1">
          {arma.problemas.map((p) => (
            <li key={p} className="flex items-start gap-1.5 text-[11px] text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {p}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-nevoa">Os slots saem vazios; encantar não aumenta o custo da arma.</p>
    </div>
  );
};
