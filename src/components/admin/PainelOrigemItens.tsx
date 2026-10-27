import React from 'react';
import { AlertTriangle, CheckCircle2, Hammer, Pencil, Pickaxe, Skull } from 'lucide-react';
import type { AuditoriaOrigens, OrigemItem } from '../../types/catalogo';
import { Miniatura } from '../common/Miniatura';
import { SecaoRecolhivel } from '../common/SecaoRecolhivel';

export const ROTULO_ORIGEM: Record<OrigemItem, string> = { COLETADO: 'Coletado', DROPADO: 'Dropado', CRAFTADO: 'Craftado' };

export interface PainelOrigemItensProps {
  auditoria: AuditoriaOrigens | null;
  /** Abre o item para marcá-lo como coletável (e cadastrar onde é achado). */
  onEditarItem: (itemId: number) => void;
  onCriarReceita: (itemId: number) => void;
  /** Leva aos monstros para adicionar o item como drop. */
  onIrParaMonstros: () => void;
  /** Cria no catálogo um item com o nome de um drop órfão. */
  onCriarItem: (nome: string) => void;
}

const Acao: React.FC<{ onClick: () => void; icone: React.ReactNode; children: React.ReactNode }> = ({ onClick, icone, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-linha text-[11px] font-cinzel text-amber-300 hover:border-ouro/50 hover:bg-amber-400/10 cursor-pointer [&>svg]:w-3.5 [&>svg]:h-3.5"
  >
    {icone}
    {children}
  </button>
);

/**
 * Regra do catálogo: todo item é coletado, dropado ou craftado.
 * Lista os que não têm origem (e os drops que apontam para itens inexistentes) com o atalho para resolver.
 */
export const PainelOrigemItens: React.FC<PainelOrigemItensProps> = ({ auditoria, onEditarItem, onCriarReceita, onIrParaMonstros, onCriarItem }) => {
  if (!auditoria) return null;
  const semOrigem = auditoria.itens.filter((i) => i.origens.length === 0);
  const comAviso = auditoria.itens.filter((i) => i.origens.length > 0 && i.avisos.length > 0);
  const orfaos = auditoria.dropsOrfaos;

  if (semOrigem.length === 0 && orfaos.length === 0 && comAviso.length === 0) {
    return (
      <p className="flex items-center gap-2 p-3 rounded-lg border border-emerald-700/40 bg-emerald-950/30 text-xs text-emerald-200">
        <CheckCircle2 className="w-4 h-4 shrink-0" /> Todos os {auditoria.totalItens} itens têm origem: são coletados, dropados ou craftados.
      </p>
    );
  }

  return (
    <SecaoRecolhivel
      chave="admin-origem-itens"
      icone={<AlertTriangle className="w-4 h-4 text-amber-400" />}
      titulo="Itens sem origem"
      resumo={`${semOrigem.length} sem origem · ${orfaos.length} drop(s) órfão(s)`}
    >
      <div className="space-y-4">
        <p className="text-[11px] text-nevoa">
          Todo item precisa ser <strong className="text-texto-2">coletado</strong>, <strong className="text-texto-2">dropado</strong> por um monstro ou{' '}
          <strong className="text-texto-2">craftado</strong> por uma receita. Sem isso, ele nunca aparece no mundo.
        </p>

        {semOrigem.length > 0 && (
          <ul className="divide-y divide-linha">
            {semOrigem.map((i) => (
              <li key={i.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  <Miniatura imagem={i.imagemUrl} />
                  <span className="min-w-0">
                    <span className="block font-cinzel text-sm font-bold text-pergaminho break-words">{i.nome}</span>
                    {i.avisos.map((a) => (
                      <span key={a} className="block text-[11px] text-amber-200">
                        {a}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <Acao onClick={() => onEditarItem(i.id)} icone={<Pickaxe />}>
                    Tornar coletável
                  </Acao>
                  <Acao onClick={onIrParaMonstros} icone={<Skull />}>
                    Monstro que dropa
                  </Acao>
                  <Acao onClick={() => onCriarReceita(i.id)} icone={<Hammer />}>
                    Criar receita
                  </Acao>
                </span>
              </li>
            ))}
          </ul>
        )}

        {comAviso.length > 0 && (
          <ul className="space-y-1">
            {comAviso.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 text-[11px] text-amber-200">
                <span>
                  <strong className="font-cinzel">{i.nome}</strong>: {i.avisos.join(' ')}
                </span>
                <Acao onClick={() => onEditarItem(i.id)} icone={<Pencil />}>
                  Editar
                </Acao>
              </li>
            ))}
          </ul>
        )}

        {orfaos.length > 0 && (
          <div className="space-y-1.5">
            <h5 className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-amber-300">Drops com item fora do catálogo</h5>
            <ul className="divide-y divide-linha">
              {orfaos.map((o) => (
                <li key={o.dropId} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <span className="text-texto-2">
                    <strong className="text-pergaminho">{o.itemNome}</strong> · dropado por {o.monstro}
                  </span>
                  <Acao onClick={() => onCriarItem(o.itemNome)} icone={<Pencil />}>
                    Criar item
                  </Acao>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SecaoRecolhivel>
  );
};
