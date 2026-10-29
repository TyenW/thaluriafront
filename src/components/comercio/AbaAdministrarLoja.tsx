import React, { useEffect, useState } from 'react';
import { Coins, Gauge, PackagePlus, Save, Target } from 'lucide-react';
import type { DetalheLoja } from '../../types/comercio';
import { adminService, type Registro } from '../../services/adminService';
import { comercioService } from '../../services/comercioService';
import { useMesa } from '../../contexts/MesaContext';
import { formatarLatao } from '../../utils/formatadores';
import { Button } from '../common/Button';

export interface AbaAdministrarLojaProps {
  detalhe: DetalheLoja;
  onAtualizado: (d: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

const Bloco: React.FC<{ titulo: string; icone: React.ReactNode; ajuda: string; children: React.ReactNode }> = ({ titulo, icone, ajuda, children }) => (
  <section className="p-4 rounded-xl bg-painel border border-linha space-y-3">
    <div>
      <h3 className="flex items-center gap-2 font-cinzel text-sm font-bold text-pergaminho">
        <span className="text-amber-400 [&>svg]:w-4 [&>svg]:h-4">{icone}</span>
        {titulo}
      </h3>
      <p className="text-[11px] text-nevoa mt-0.5">{ajuda}</p>
    </div>
    {children}
  </section>
);

/** Ajustes diretos do Mestre: caixa, nível da oficina, estoque e procura. */
export const AbaAdministrarLoja: React.FC<AbaAdministrarLojaProps> = ({ detalhe, onAtualizado, avisar }) => {
  const loja = detalhe.loja;
  const { mesaId } = useMesa();
  const [caixaPO, setCaixaPO] = useState(String(loja.caixaLatao / 10_000));
  const [nivel, setNivel] = useState(loja.nivel);
  const [catalogo, setCatalogo] = useState<Registro[]>([]);
  const [itemId, setItemId] = useState('');
  const [delta, setDelta] = useState(5);
  const [demanda, setDemanda] = useState(5);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useEffect(() => {
    setCaixaPO(String(loja.caixaLatao / 10_000));
    setNivel(loja.nivel);
  }, [loja.caixaLatao, loja.nivel]);

  useEffect(() => {
    adminService
      .listar('itens')
      .then(setCatalogo)
      .catch((err: any) => avisar('erro', err.message || 'Não foi possível carregar o catálogo de itens.'));
  }, [avisar]);

  const executar = async (chave: string, acao: () => Promise<DetalheLoja>, msg: string) => {
    setOcupado(chave);
    try {
      onAtualizado(await acao());
      avisar('sucesso', msg);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível aplicar o ajuste.');
    } finally {
      setOcupado(null);
    }
  };

  const caixaLatao = Math.round((Number(caixaPO.replace(',', '.')) || 0) * 10_000);
  const itemEscolhido = catalogo.find((i) => String(i.id) === itemId);
  const demandaAtual = detalhe.estoque.find((m) => String(m.itemId) === itemId)?.demanda;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Bloco titulo="Caixa" icone={<Coins />} ajuda={`Hoje: ${formatarLatao(loja.caixaLatao)}. Registrado no livro-caixa como ajuste do Mestre.`}>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Novo caixa em PO</span>
            <input inputMode="decimal" value={caixaPO} onChange={(e) => setCaixaPO(e.target.value)} className="campo font-mono" />
          </label>
          <span className="self-center text-xs text-nevoa">PO</span>
          <Button
            variant="gold"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            loading={ocupado === 'caixa'}
            disabled={caixaLatao < 0 || caixaLatao === loja.caixaLatao}
            onClick={() => executar('caixa', () => comercioService.ajustar(loja.id, { acao: 'CAIXA', valorLatao: caixaLatao }, mesaId), `Caixa definido em ${formatarLatao(caixaLatao)}.`)}
          >
            Definir
          </Button>
        </div>
      </Bloco>

      <Bloco titulo="Nível da oficina" icone={<Gauge />} ajuda="Porte e prestígio da loja (1 a 5). Moldes de artesanato avançados só são feitos em oficinas de nível alto.">
        <div className="flex gap-2">
          <select aria-label="Nível" value={nivel} onChange={(e) => setNivel(Number(e.target.value))} className="campo flex-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Nível {n}
              </option>
            ))}
          </select>
          <Button
            variant="gold"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            loading={ocupado === 'nivel'}
            disabled={nivel === loja.nivel}
            onClick={() => executar('nivel', () => comercioService.ajustar(loja.id, { acao: 'NIVEL', nivel }, mesaId), `Oficina agora é nível ${nivel}.`)}
          >
            Salvar
          </Button>
        </div>
      </Bloco>

      <div className="lg:col-span-2">
        <Bloco titulo="Estoque e procura" icone={<PackagePlus />} ajuda="Abasteça ou retire mercadorias sem mexer no caixa, e ajuste quanto os clientes procuram por dia.">
          <select aria-label="Item" value={itemId} onChange={(e) => setItemId(e.target.value)} className="campo">
            <option value="">{catalogo.length ? 'Escolha um item do catálogo…' : 'Carregando catálogo…'}</option>
            {catalogo.map((i) => (
              <option key={i.id} value={String(i.id)}>
                {String(i.nome)}
              </option>
            ))}
          </select>
          {itemEscolhido && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2 items-end">
                <label className="flex-1">
                  <span className="block text-[11px] font-cinzel uppercase tracking-wider text-ouro/90 mb-1">Unidades (+ abastece, − retira)</span>
                  <input type="number" inputMode="numeric" value={delta} onChange={(e) => setDelta(Math.floor(Number(e.target.value) || 0))} className="campo font-mono" />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  loading={ocupado === 'estoque'}
                  disabled={delta === 0}
                  onClick={() =>
                    executar('estoque', () => comercioService.ajustar(loja.id, { acao: 'ESTOQUE', itemId: Number(itemId), delta }, mesaId), `${delta > 0 ? 'Abastecido' : 'Retirado'}: ${Math.abs(delta)}× ${itemEscolhido.nome}.`)
                  }
                >
                  Aplicar
                </Button>
              </div>
              <div className="flex gap-2 items-end">
                <label className="flex-1">
                  <span className="block text-[11px] font-cinzel uppercase tracking-wider text-ouro/90 mb-1">
                    Procura por dia{demandaAtual != null ? ` (hoje ${demandaAtual})` : ''}
                  </span>
                  <input type="number" inputMode="numeric" min={0} max={999} value={demanda} onChange={(e) => setDemanda(Math.floor(Number(e.target.value) || 0))} className="campo font-mono" />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Target className="w-3.5 h-3.5" />}
                  loading={ocupado === 'demanda'}
                  onClick={() =>
                    executar('demanda', () => comercioService.ajustar(loja.id, { acao: 'DEMANDA', itemId: Number(itemId), demanda }, mesaId), `Procura de ${itemEscolhido.nome} definida em ${demanda}.`)
                  }
                >
                  Definir
                </Button>
              </div>
            </div>
          )}
          <p className="text-[11px] text-nevoa">A procura volta a oscilar a cada dia de mercado; use-a para um empurrão pontual (festival, guerra, escassez).</p>
        </Bloco>
      </div>
    </div>
  );
};
