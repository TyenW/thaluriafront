import React, { useEffect, useMemo, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import type { DetalheLoja } from '../../types/comercio';
import type { FichaPersonagem, ItemInventarioFicha } from '../../types/ficha';
import { fichasService } from '../../services/fichasService';
import { comercioService } from '../../services/comercioService';
import { formatarLatao } from '../../utils/formatadores';
import { useMesa } from '../../contexts/MesaContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export interface ModalComprarItemProps {
  detalhe: DetalheLoja;
  onFechar: () => void;
  onComprado: (detalhe: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

/**
 * Um personagem vende um item do inventário à loja. O preço sugerido é o que a loja paga a
 * fornecedores no dia da mesa (foto do mercado, se ela estiver atrasada); o item entra no estoque de agora.
 */
export const ModalComprarItem: React.FC<ModalComprarItemProps> = ({ detalhe, onFechar, onComprado, avisar }) => {
  const { painel, mesa, mesaId } = useMesa();
  const [fichas, setFichas] = useState<FichaPersonagem[]>([]);
  const [fichaEscolhida, setFichaEscolhida] = useState('');
  const [inventario, setInventario] = useState<{ fichaId: string; itens: ItemInventarioFicha[] } | null>(null);
  const [itemId, setItemId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [precoPO, setPrecoPO] = useState('');
  const [pagar, setPagar] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Personagens da mesa escolhida primeiro
  const daMesa = useMemo(() => new Set((painel?.fichas ?? []).filter((f) => mesa && f.mesaId === mesa.id).map((f) => f.id)), [painel, mesa]);
  const ordenadas = useMemo(() => [...fichas].sort((a, b) => Number(daMesa.has(b.id)) - Number(daMesa.has(a.id))), [fichas, daMesa]);

  useEffect(() => {
    fichasService
      .listarTodas(undefined, 'MESTRE')
      .then(setFichas)
      .catch((err: any) => avisar('erro', err.message || 'Não foi possível listar as fichas.'));
  }, [avisar]);

  // Sem escolha, vale o primeiro personagem (os da mesa vêm antes)
  const fichaId = fichaEscolhida || (ordenadas[0] ? String(ordenadas[0].id) : '');

  useEffect(() => {
    if (!fichaId) return;
    fichasService
      .obterPorId(fichaId)
      .then((f) => setInventario({ fichaId, itens: f?.inventario ?? [] }))
      .catch((err: any) => avisar('erro', err.message || 'Não foi possível abrir o inventário.'));
  }, [fichaId, avisar]);

  const itens = inventario?.fichaId === fichaId ? inventario.itens : [];
  const item = itens.find((i) => String(i.id) === itemId);
  const naLoja = detalhe.estoque.find((m) => String(m.itemId) === itemId);

  const escolherFicha = (id: string) => {
    setFichaEscolhida(id);
    setItemId('');
  };

  const escolherItem = (id: string) => {
    setItemId(id);
    setQuantidade(1);
    // Sugestão: o que a loja paga a fornecedores no dia da mesa; item que a loja não conhece fica a cargo do servidor
    const conhecido = detalhe.estoque.find((m) => String(m.itemId) === id);
    setPrecoPO(conhecido ? String(conhecido.precoCompraLatao / 10_000) : '');
  };

  const precoUnitarioLatao = precoPO.trim() === '' ? null : Math.max(0, Math.round((Number(precoPO.replace(',', '.')) || 0) * 10_000));
  const total = (precoUnitarioLatao ?? 0) * quantidade;
  const semCaixa = pagar && total > detalhe.loja.caixaLatao;
  const qtdValida = !!item && quantidade >= 1 && quantidade <= item.quantidade;
  const ficha = fichas.find((f) => String(f.id) === fichaId);

  const comprar = async () => {
    if (!ficha || !item) return;
    setEnviando(true);
    try {
      const r = await comercioService.comprar({
        lojaId: detalhe.loja.id,
        itemId: item.id,
        fichaId: ficha.id,
        quantidade,
        precoUnitarioLatao: precoUnitarioLatao ?? undefined,
        pagar,
        mesaId,
      });
      avisar('sucesso', pagar ? `${detalhe.loja.nome} comprou ${quantidade}× ${item.nome} de ${ficha.nome} por ${formatarLatao(r.totalLatao)}.` : `${ficha.nome} deixou ${quantidade}× ${item.nome} na loja.`);
      onComprado(r.detalhe);
      onFechar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível concluir a compra.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal aberto titulo="Comprar de personagem" icone={<PackagePlus className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={enviando}>
      <div className="space-y-4">
        <div>
          <label htmlFor="compra-ficha" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
            Quem vende
          </label>
          <select id="compra-ficha" value={fichaId} onChange={(e) => escolherFicha(e.target.value)} className="campo">
            {ordenadas.length === 0 && <option value="">Nenhuma ficha cadastrada</option>}
            {ordenadas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} ({f.raca}){mesa && daMesa.has(f.id) ? ` · mesa ${mesa.nome}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="compra-item" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
            Item do inventário
          </label>
          <select id="compra-item" value={itemId} onChange={(e) => escolherItem(e.target.value)} className="campo">
            <option value="">{itens.length === 0 ? 'Inventário vazio' : 'Selecione…'}</option>
            {itens.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} ×{i.quantidade}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="compra-qtd" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
              Quantidade{item ? ` (máx. ${item.quantidade})` : ''}
            </label>
            <input
              id="compra-qtd"
              type="number"
              inputMode="numeric"
              min={1}
              max={item?.quantidade ?? 1}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.floor(Number(e.target.value) || 1))}
              aria-invalid={!!item && !qtdValida}
              className="campo font-mono"
            />
          </div>
          <div>
            <label htmlFor="compra-preco" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
              Preço por unidade (PO)
            </label>
            <input
              id="compra-preco"
              inputMode="decimal"
              value={precoPO}
              onChange={(e) => setPrecoPO(e.target.value)}
              placeholder="Preço do servidor"
              className="campo font-mono"
              disabled={!pagar}
            />
          </div>
        </div>
        <p className="text-[11px] text-nevoa">
          {naLoja
            ? `A loja paga ${formatarLatao(naLoja.precoCompraLatao)} a fornecedores${mesa?.noPassado ? ` no dia ${mesa.dia}` : ' hoje'}.`
            : 'A loja não negocia este item: deixe o preço vazio para usar o que ela pagaria a um fornecedor.'}{' '}
          O item entra no estoque de agora.
        </p>

        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer">
          <input type="checkbox" checked={pagar} onChange={(e) => setPagar(e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
          <span className="text-xs text-texto-2">
            <strong className="font-cinzel text-pergaminho">A loja paga ao personagem</strong>
            <span className="block text-nevoa">Desmarcado, o item vai para a loja sem pagamento (doação, troca, acordo).</span>
          </span>
        </label>

        <div className="flex flex-wrap items-baseline justify-between gap-2 p-3 rounded-lg bg-painel-alto">
          <span className="text-xs text-nevoa">Total</span>
          <strong className={`font-mono text-lg ${semCaixa ? 'text-red-300' : 'text-amber-300'}`}>
            {!pagar ? 'Sem pagamento' : precoUnitarioLatao == null ? 'Preço do servidor' : formatarLatao(total)}
          </strong>
          {pagar && (
            <span className={`w-full text-[11px] ${semCaixa ? 'text-red-300' : 'text-nevoa'}`}>
              Caixa da loja: {formatarLatao(detalhe.loja.caixaLatao)}
              {semCaixa && ' — não dá para pagar'}
            </span>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="gold" size="sm" icon={<PackagePlus className="w-3.5 h-3.5" />} loading={enviando} disabled={!ficha || !qtdValida || semCaixa} onClick={comprar}>
            Comprar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
