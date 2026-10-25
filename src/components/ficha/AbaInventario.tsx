import React, { useState } from 'react';
import { Backpack, Coins, Gift, Minus, Plus, Trash2 } from 'lucide-react';
import type { FichaPersonagem, ItemInventarioFicha } from '../../types/ficha';
import { resumirMoedas } from '../../data/moedas';
import type { DerivadosFicha } from '../../utils/calculosFicha';
import { corRaridade, rotuloEnum } from '../../utils/formatadores';
import { fichasService } from '../../services/fichasService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EstadoVazio } from '../common/EstadoVazio';
import { ModalConfirmacao } from '../common/ModalConfirmacao';
import { Miniatura } from '../common/Miniatura';
import { ModalConcederItem } from './ModalConcederItem';

export interface AbaInventarioProps {
  ficha: FichaPersonagem;
  derivados: DerivadosFicha;
  onIrParaMoedas: () => void;
  /** Mestre: pode conceder e retirar itens. */
  podeGerenciar?: boolean;
  onInventarioAtualizado?: (inventario: ItemInventarioFicha[]) => void;
  avisar?: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const AbaInventario: React.FC<AbaInventarioProps> = ({ ficha, derivados, onIrParaMoedas, podeGerenciar = false, onInventarioAtualizado, avisar }) => {
  const itens = ficha.inventario ?? [];
  const pesoTotal = itens.reduce((soma, i) => soma + (i.pesoKg || 0) * (i.quantidade || 0), 0);
  const sobrecarga = pesoTotal > derivados.cargaMaxKg;
  const [modalConceder, setModalConceder] = useState(false);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [paraRemover, setParaRemover] = useState<ItemInventarioFicha | null>(null);

  const ajustar = async (item: ItemInventarioFicha, delta: number | 'tudo') => {
    setOcupado(item.id);
    try {
      const inventario =
        delta === 'tudo' ? await fichasService.retirarItem(ficha.id, item.id)
        : delta > 0 ? await fichasService.concederItem(ficha.id, item.id, delta)
        : await fichasService.retirarItem(ficha.id, item.id, -delta);
      onInventarioAtualizado?.(inventario);
      if (delta === 'tudo') avisar?.('sucesso', `${item.nome} retirado do inventário.`);
    } catch (err: any) {
      avisar?.('erro', err.message || 'Não foi possível alterar o inventário.');
    } finally {
      setOcupado(null);
      setParaRemover(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onIrParaMoedas}
          className="flex items-center gap-3 p-4 bg-painel border border-linha hover:border-amber-500/50 rounded-xl text-left cursor-pointer transition-colors"
        >
          <span className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-600/40 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="text-xs font-cinzel text-nevoa block">Moedas · gerenciar na aba Moedas</span>
            <strong className="text-sm font-mono text-amber-300 block truncate">{resumirMoedas(ficha.moedas)}</strong>
          </span>
        </button>

        <div className="flex items-center gap-3 p-4 bg-painel border border-linha rounded-xl">
          <span className="w-10 h-10 rounded-lg bg-painel-alto border border-linha flex items-center justify-center text-cyan-400 shrink-0">
            <Backpack className="w-5 h-5" />
          </span>
          <span>
            <span className="text-xs font-cinzel text-nevoa block">Carga (FOR × 5)</span>
            <strong className={`text-sm font-mono ${sobrecarga ? 'text-red-300' : 'text-pergaminho'}`}>
              {pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / {derivados.cargaMaxKg} kg
            </strong>
            {sobrecarga && <span className="block text-[11px] text-red-300">Acima da capacidade de carga</span>}
          </span>
        </div>
      </div>

      {podeGerenciar && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-amber-600/30 bg-amber-950/10">
          <p className="text-xs text-texto-2">
            <strong className="font-cinzel text-amber-300">Mestre:</strong> entregue saques, recompensas e itens de história a este personagem.
          </p>
          <Button id="btn-abrir-conceder-item" variant="gold" size="sm" icon={<Gift className="w-3.5 h-3.5" />} onClick={() => setModalConceder(true)}>
            Conceder item
          </Button>
        </div>
      )}

      {itens.length === 0 ? (
        <EstadoVazio icone={<Backpack />} titulo="Mochila vazia">
          Nenhum item registrado para este personagem. {podeGerenciar ? 'Use “Conceder item” para entregar o primeiro.' : 'Itens recebidos do Mestre, de lojas e oficinas aparecem aqui.'}
        </EstadoVazio>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {itens.map((item) => (
            <li key={item.id} className="p-3.5 rounded-xl bg-painel border border-linha flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Miniatura imagem={item.imagemUrl} tamanho="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-cinzel text-sm font-bold text-pergaminho break-words">{item.nome}</h4>
                    <Badge variant="gold">{rotuloEnum(item.tipo)}</Badge>
                  </div>
                  {item.raridade && <span className={`text-[11px] font-cinzel uppercase tracking-wider ${corRaridade(item.raridade)}`}>{rotuloEnum(item.raridade)}</span>}
                  {item.descricao && <p className="text-xs text-nevoa font-sans-clean mt-1 line-clamp-3">{item.descricao}</p>}
                </div>
              </div>
              <div className="mt-auto pt-2 border-t border-linha flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-cinzel text-nevoa">
                <span>
                  Qtd: <strong className="text-amber-300">{item.quantidade}×</strong>
                </span>
                <span>
                  Peso: <strong className="text-texto-2">{item.pesoKg} kg</strong>
                </span>
                <span title="Preço de referência do item, em latão">
                  <strong className="text-amber-400 font-mono">{item.precoLatao.toLocaleString('pt-BR')} PL</strong>
                </span>
              </div>
              {podeGerenciar && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => ajustar(item, -1)}
                    disabled={ocupado === item.id}
                    className="p-1.5 rounded-md border border-linha-forte text-nevoa hover:text-red-300 hover:border-red-600/50 disabled:opacity-40 cursor-pointer"
                    aria-label={`Retirar 1 ${item.nome}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => ajustar(item, 1)}
                    disabled={ocupado === item.id}
                    className="p-1.5 rounded-md border border-linha-forte text-nevoa hover:text-emerald-300 hover:border-emerald-600/50 disabled:opacity-40 cursor-pointer"
                    aria-label={`Conceder mais 1 ${item.nome}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setParaRemover(item)}
                    disabled={ocupado === item.id}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-cinzel text-red-300 hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Retirar tudo
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {podeGerenciar && avisar && (
        <ModalConcederItem
          aberto={modalConceder}
          fichaId={ficha.id}
          nomePersonagem={ficha.nome}
          onFechar={() => setModalConceder(false)}
          onConcedido={(inv) => onInventarioAtualizado?.(inv)}
          avisar={avisar}
        />
      )}

      <ModalConfirmacao
        aberto={!!paraRemover}
        titulo="Retirar item"
        textoConfirmar="Retirar tudo"
        perigoso
        carregando={ocupado !== null}
        onConfirmar={() => paraRemover && ajustar(paraRemover, 'tudo')}
        onCancelar={() => setParaRemover(null)}
      >
        Retirar <strong className="text-amber-300">{paraRemover?.quantidade}× {paraRemover?.nome}</strong> do inventário de {ficha.nome}?
      </ModalConfirmacao>
    </div>
  );
};
