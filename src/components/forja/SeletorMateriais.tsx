import React from 'react';
import { Minus } from 'lucide-react';
import type { EscolhaMaterial, MaterialForja, MoldeArma, OpcaoParte, ParteMolde } from '../../types/forja';
import { corRaridade } from '../../utils/formatadores';

export const ROTULO_CATEGORIA: Record<string, string> = {
  METAL: 'Metal',
  MADEIRA: 'Madeira',
  COURO: 'Couro',
  FIBRA: 'Fibra',
  GEMA: 'Gema',
  OSSO: 'Osso',
  ESCAMA: 'Escama',
  OUTRO: 'Outro',
};

/** A opção da parte que vale para o material (a de item específico vence a de categoria), como no servidor. */
export const opcaoPara = (parte: ParteMolde, m: MaterialForja): OpcaoParte | undefined =>
  parte.opcoes.find((o) => o.itemId === m.id) ?? parte.opcoes.find((o) => o.itemId == null && o.categoria != null && o.categoria === m.categoria);

export const rotuloOpcao = (o: OpcaoParte) => (o.itemId != null ? (o.itemNome ?? `Item #${o.itemId}`) : ROTULO_CATEGORIA[o.categoria ?? ''] ?? '?');

const bonusTexto = (o: OpcaoParte) =>
  [o.bonusDano ? `${o.bonusDano > 0 ? '+' : ''}${o.bonusDano} dano` : '', o.bonusDurabilidade ? `${o.bonusDurabilidade > 0 ? '+' : ''}${o.bonusDurabilidade} dur.` : '', o.bonusAlcanceM ? `+${o.bonusAlcanceM} m` : '']
    .filter(Boolean)
    .join(' · ');

export interface SeletorMateriaisProps {
  molde: MoldeArma;
  materiais: MaterialForja[];
  escolhas: EscolhaMaterial[];
  onAlterar: (escolhas: EscolhaMaterial[]) => void;
  /** Quanto de cada material a loja tem (mostra na encomenda). */
  estoque?: Record<number, number>;
}

/**
 * Escolha dos materiais parte a parte. Toque num material para pôr uma unidade; em parte de
 * um material só, tocar em outro troca. Só aparecem os materiais que a parte aceita.
 */
export const SeletorMateriais: React.FC<SeletorMateriaisProps> = ({ molde, materiais, escolhas, onAlterar, estoque }) => {
  const qtd = (parteId: number, itemId: number) => escolhas.find((e) => e.parteId === parteId && e.itemId === itemId)?.quantidade ?? 0;
  const totalDa = (parteId: number) => escolhas.filter((e) => e.parteId === parteId).reduce((s, e) => s + e.quantidade, 0);

  const mudar = (parte: ParteMolde, itemId: number, delta: number) => {
    let novas = escolhas.map((e) => ({ ...e }));
    const total = totalDa(parte.id);
    if (delta > 0 && total >= parte.qtdMateriais) {
      if (parte.qtdMateriais !== 1) return;
      novas = novas.filter((e) => e.parteId !== parte.id); // parte de um material só: troca
    }
    const atual = novas.find((e) => e.parteId === parte.id && e.itemId === itemId);
    if (atual) atual.quantidade += delta;
    else if (delta > 0) novas.push({ parteId: parte.id, itemId, quantidade: delta });
    onAlterar(novas.filter((e) => e.quantidade > 0));
  };

  return (
    <div className="space-y-3">
      {molde.partes.map((parte) => {
        const aceitos = materiais.filter((m) => opcaoPara(parte, m));
        const total = totalDa(parte.id);
        const completa = total === parte.qtdMateriais;
        return (
          <fieldset key={parte.id} className="rounded-xl border border-linha bg-abismo/60 p-3">
            <legend className="sr-only">{parte.nome}</legend>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <span className="font-cinzel text-sm font-bold text-pergaminho">{parte.nome}</span>
              <span className={`font-mono text-xs ${completa ? 'text-emerald-300' : 'text-amber-300'}`}>
                {total}/{parte.qtdMateriais} material(is)
              </span>
            </div>
            <p className="text-[11px] text-nevoa mb-2">
              Aceita:{' '}
              {parte.opcoes.map((o, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <span className="text-texto-2">{rotuloOpcao(o)}</span>
                  {bonusTexto(o) && <span className="text-amber-300"> ({bonusTexto(o)})</span>}
                </span>
              ))}
            </p>
            {aceitos.length === 0 ? (
              <p className="text-[11px] text-red-300">Nenhum material do catálogo serve aqui. Dê uma categoria aos materiais em Gerenciar → Itens.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {aceitos.map((m) => {
                  const n = qtd(parte.id, m.id);
                  const cheio = !n && total >= parte.qtdMateriais && parte.qtdMateriais !== 1;
                  return (
                    <li key={m.id} className="flex">
                      <button
                        type="button"
                        onClick={() => mudar(parte, m.id, 1)}
                        disabled={cheio}
                        aria-pressed={n > 0}
                        title={`Dano +${m.bonusDano} · durabilidade ${m.durabilidade} · ${m.pesoKg} kg`}
                        className={`px-2 py-1 text-left text-xs border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${n > 0 ? 'rounded-l-md border-ouro/60 bg-amber-400/15' : 'rounded-md border-linha hover:border-linha-forte'}`}
                      >
                        <span className={`font-semibold ${corRaridade(m.raridade)}`}>{m.nome}</span>
                        {n > 0 && <span className="ml-1 font-mono text-amber-300">×{n}</span>}
                        <span className="block text-[10px] text-nevoa">
                          +{m.bonusDano} dano · {m.durabilidade} dur.{estoque && ` · tem ${estoque[m.id] ?? 0}`}
                        </span>
                      </button>
                      {n > 0 && (
                        <button
                          type="button"
                          onClick={() => mudar(parte, m.id, -1)}
                          aria-label={`Tirar uma unidade de ${m.nome}`}
                          className="px-1.5 rounded-r-md border border-l-0 border-ouro/60 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </fieldset>
        );
      })}
    </div>
  );
};
