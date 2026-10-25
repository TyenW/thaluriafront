import React, { useEffect, useMemo, useState } from 'react';
import { Gift, Minus, Plus, Search } from 'lucide-react';
import { adminService, type Registro } from '../../services/adminService';
import { fichasService } from '../../services/fichasService';
import type { ItemInventarioFicha } from '../../types/ficha';
import { corRaridade, rotuloEnum } from '../../utils/formatadores';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Miniatura } from '../common/Miniatura';

const QUANTIDADE_MAX = 99999;

export interface ModalConcederItemProps {
  aberto: boolean;
  fichaId: number;
  nomePersonagem: string;
  onFechar: () => void;
  onConcedido: (inventario: ItemInventarioFicha[]) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

/** Mestre: escolhe um item do catálogo e a quantidade a entregar ao personagem. */
export const ModalConcederItem: React.FC<ModalConcederItemProps> = ({ aberto, fichaId, nomePersonagem, onFechar, onConcedido, avisar }) => {
  const [catalogo, setCatalogo] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<Registro | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setBusca('');
    setEscolhido(null);
    setQuantidade(1);
    setErro(null);
    setCarregando(true);
    adminService
      .listar('itens')
      .then(setCatalogo)
      .catch((err: any) => setErro(err.message || 'Não foi possível carregar o catálogo de itens.'))
      .finally(() => setCarregando(false));
  }, [aberto]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return catalogo;
    return catalogo.filter((i) => `${i.nome} ${i.tipo} ${i.raridade}`.toLowerCase().includes(termo));
  }, [catalogo, busca]);

  const conceder = async () => {
    if (!escolhido) return;
    setEnviando(true);
    try {
      const inventario = await fichasService.concederItem(fichaId, escolhido.id, quantidade);
      onConcedido(inventario);
      avisar('sucesso', `${quantidade}× ${escolhido.nome} entregue a ${nomePersonagem}.`);
      // Continua aberto para entregar mais itens do mesmo saque.
      setEscolhido(null);
      setQuantidade(1);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível conceder o item.');
    } finally {
      setEnviando(false);
    }
  };

  const ajustar = (delta: number) => setQuantidade((q) => Math.min(QUANTIDADE_MAX, Math.max(1, q + delta)));

  return (
    <Modal aberto={aberto} titulo={`Conceder item a ${nomePersonagem}`} icone={<Gift className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={enviando} tamanho="lg">
      <div className="space-y-4">
        <label className="relative block">
          <span className="sr-only">Buscar item</span>
          <Search className="w-4 h-4 text-nevoa absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="input-busca-item-conceder"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, tipo ou raridade…"
            className="campo pl-9"
            autoFocus
          />
        </label>

        {erro && <p className="text-xs text-red-300">{erro}</p>}

        <ul className="max-h-72 overflow-y-auto rounded-lg border border-linha divide-y divide-linha" aria-label="Catálogo de itens">
          {carregando ? (
            <li className="p-4 text-xs text-nevoa">Abrindo o catálogo…</li>
          ) : filtrados.length === 0 ? (
            <li className="p-4 text-xs text-nevoa">
              {catalogo.length === 0 ? 'Nenhum item cadastrado. Crie itens em Gerenciar → Itens.' : `Nada encontrado para “${busca}”.`}
            </li>
          ) : (
            filtrados.map((item) => {
              const ativo = escolhido?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setEscolhido(item)}
                    aria-pressed={ativo}
                    className={`w-full flex items-center gap-3 p-2.5 text-left cursor-pointer transition-colors ${ativo ? 'bg-amber-400/10' : 'hover:bg-white/5'}`}
                  >
                    <Miniatura imagem={item.imagem_url as string | null} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-cinzel font-bold text-pergaminho truncate">{String(item.nome)}</span>
                      <span className="block text-[11px] text-nevoa">
                        {rotuloEnum(String(item.tipo))} · <span className={corRaridade(String(item.raridade))}>{rotuloEnum(String(item.raridade))}</span>
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-nevoa shrink-0">{Number(item.peso_kg ?? 0)} kg</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-linha">
          <div className="flex items-center gap-2">
            <span className="text-xs font-cinzel text-nevoa">Quantidade</span>
            <button type="button" onClick={() => ajustar(-1)} className="p-2 rounded-md border border-linha-forte hover:border-ouro/60 cursor-pointer" aria-label="Diminuir quantidade">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              id="input-quantidade-conceder"
              type="number"
              inputMode="numeric"
              min={1}
              max={QUANTIDADE_MAX}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.min(QUANTIDADE_MAX, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
              className="campo w-20 text-center font-mono"
            />
            <button type="button" onClick={() => ajustar(1)} className="p-2 rounded-md border border-linha-forte hover:border-ouro/60 cursor-pointer" aria-label="Aumentar quantidade">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="ghost" size="sm" onClick={onFechar} disabled={enviando}>
              Concluir
            </Button>
            <Button id="btn-conceder-item" variant="gold" size="sm" icon={<Gift className="w-3.5 h-3.5" />} loading={enviando} disabled={!escolhido} onClick={conceder}>
              {escolhido ? `Conceder ${quantidade}× ${escolhido.nome}` : 'Escolha um item'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
