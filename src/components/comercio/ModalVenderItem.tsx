import React, { useEffect, useState } from 'react';
import { HandCoins } from 'lucide-react';
import type { MercadoriaLoja, DetalheLoja } from '../../types/comercio';
import type { FichaPersonagem } from '../../types/ficha';
import { fichasService } from '../../services/fichasService';
import { comercioService } from '../../services/comercioService';
import { formatarLatao } from '../../utils/formatadores';
import { useMesa } from '../../contexts/MesaContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export interface ModalVenderItemProps {
  lojaId: number;
  /** Mercadoria escolhida; null fecha o modal. */
  mercadoria: MercadoriaLoja | null;
  onFechar: () => void;
  onVendido: (detalhe: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

/** O Mestre, como mercador, vende (ou entrega) um item do estoque a um personagem pelo preço que quiser. */
export const ModalVenderItem: React.FC<ModalVenderItemProps> = ({ lojaId, mercadoria, onFechar, onVendido, avisar }) => {
  const [fichas, setFichas] = useState<FichaPersonagem[]>([]);
  const [fichaId, setFichaId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [precoPO, setPrecoPO] = useState('');
  const [cobrar, setCobrar] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const { mesa, mesaId } = useMesa();

  useEffect(() => {
    if (!mercadoria) return;
    setQuantidade(1);
    setCobrar(true);
    // Preço sugerido: o preço dinâmico do balcão, em PO para facilitar a digitação
    setPrecoPO(String(mercadoria.precoVendaLatao / 10_000));
    fichasService
      .listarTodas(undefined, 'MESTRE')
      .then((lista) => {
        setFichas(lista);
        setFichaId((atual) => atual || (lista[0] ? String(lista[0].id) : ''));
      })
      .catch((err: any) => avisar('erro', err.message || 'Não foi possível listar as fichas.'));
  }, [mercadoria, avisar]);

  if (!mercadoria) return null;

  const precoUnitarioLatao = Math.max(0, Math.round((Number(precoPO.replace(',', '.')) || 0) * 10_000));
  const total = precoUnitarioLatao * quantidade;
  const ficha = fichas.find((f) => String(f.id) === fichaId);
  const saldo = ficha?.carteiraLatao ?? 0;
  const semSaldo = cobrar && total > saldo;
  // Mesa atrasada: vê a foto do dia dela, mas só leva o que ainda existe hoje
  const maximo = mercadoria.disponivel ?? mercadoria.quantidade;
  const qtdValida = quantidade >= 1 && quantidade <= maximo;

  const vender = async () => {
    if (!ficha) return;
    setEnviando(true);
    try {
      const r = await comercioService.vender({ lojaId, itemId: mercadoria.itemId, fichaId: ficha.id, quantidade, precoUnitarioLatao, cobrar, mesaId });
      avisar('sucesso', cobrar ? `${quantidade}× ${mercadoria.nome} vendido a ${ficha.nome} por ${formatarLatao(r.totalLatao)}.` : `${quantidade}× ${mercadoria.nome} entregue a ${ficha.nome}.`);
      onVendido(r.detalhe);
      onFechar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível concluir a venda.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal aberto titulo={`Vender ${mercadoria.nome}`} icone={<HandCoins className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={enviando}>
      <div className="space-y-4">
        <div>
          <label htmlFor="venda-ficha" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
            Para qual personagem
          </label>
          <select id="venda-ficha" value={fichaId} onChange={(e) => setFichaId(e.target.value)} className="campo">
            {fichas.length === 0 && <option value="">Nenhuma ficha cadastrada</option>}
            {fichas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} ({f.raca}) — {formatarLatao(f.carteiraLatao ?? 0)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="venda-qtd" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
              Quantidade (máx. {maximo})
            </label>
            <input
              id="venda-qtd"
              type="number"
              inputMode="numeric"
              min={1}
              max={maximo}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.floor(Number(e.target.value) || 1))}
              aria-invalid={!qtdValida}
              className="campo font-mono"
            />
          </div>
          <div>
            <label htmlFor="venda-preco" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
              Preço por unidade (PO)
            </label>
            <input
              id="venda-preco"
              inputMode="decimal"
              value={precoPO}
              onChange={(e) => setPrecoPO(e.target.value)}
              className="campo font-mono"
              disabled={!cobrar}
            />
          </div>
        </div>
        {mesa?.noPassado && (
          <p className="text-[11px] text-amber-200 p-2 rounded-md bg-amber-950/30 border border-amber-500/30">
            Mesa {mesa.nome} no dia {mesa.dia}: preço desse dia. A foto mostra {mercadoria.quantidade}, mas hoje a loja tem {mercadoria.quantidadeHoje ?? mercadoria.quantidade}
            {maximo === 0 && ' — outra mesa já levou tudo, narre que acabou'}.
          </p>
        )}
        <p className="text-[11px] text-nevoa">
          {mesa?.noPassado ? `Balcão no dia ${mesa.dia}:` : 'Balcão hoje:'} <strong className="text-texto-2">{formatarLatao(mercadoria.precoVendaLatao)}</strong> · referência{' '}
          <strong className="text-texto-2">{formatarLatao(mercadoria.precoBaseLatao)}</strong> · a loja paga {formatarLatao(mercadoria.precoCompraLatao)} a fornecedores
        </p>

        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer">
          <input type="checkbox" checked={cobrar} onChange={(e) => setCobrar(e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
          <span className="text-xs text-texto-2">
            <strong className="font-cinzel text-pergaminho">Cobrar da carteira do personagem</strong>
            <span className="block text-nevoa">Desmarcado, o item sai do estoque sem pagamento (presente, recompensa, acordo).</span>
          </span>
        </label>

        <div className="flex flex-wrap items-baseline justify-between gap-2 p-3 rounded-lg bg-painel-alto">
          <span className="text-xs text-nevoa">Total</span>
          <strong className={`font-mono text-lg ${semSaldo ? 'text-red-300' : 'text-amber-300'}`}>{cobrar ? formatarLatao(total) : 'Sem cobrança'}</strong>
          {cobrar && ficha && (
            <span className={`w-full text-[11px] ${semSaldo ? 'text-red-300' : 'text-nevoa'}`}>
              {ficha.nome} tem {formatarLatao(saldo)}
              {semSaldo && ' — não dá para pagar'}
            </span>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button id="btn-confirmar-venda" variant="gold" size="sm" icon={<HandCoins className="w-3.5 h-3.5" />} loading={enviando} disabled={!ficha || !qtdValida || semSaldo} onClick={vender}>
            {cobrar ? 'Vender' : 'Entregar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
