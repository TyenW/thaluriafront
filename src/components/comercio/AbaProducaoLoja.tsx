import React, { useState } from 'react';
import { Anvil, Ban, Bot, CheckCircle2, Clock, Crown, Hammer, Lock, XCircle } from 'lucide-react';
import type { DetalheLoja, ReceitaComercio } from '../../types/comercio';
import { comercioService } from '../../services/comercioService';
import { formatarLatao } from '../../utils/formatadores';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EstadoVazio } from '../common/EstadoVazio';
import { Modal } from '../common/Modal';
import { ModalConfirmacao } from '../common/ModalConfirmacao';
import { ModalEncomendarArma } from './ModalEncomendarArma';
import { CampoEncomendaPersonagem } from './CampoEncomendaPersonagem';
import { descreverEntregas } from '../../services/mesasService';
import { useMesa } from '../../contexts/MesaContext';
import type { OrdemComercio } from '../../types/comercio';

const ModalProduzir: React.FC<{
  lojaId: number;
  receita: ReceitaComercio;
  onFechar: () => void;
  onFeito: (d: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}> = ({ lojaId, receita, onFechar, onFeito, avisar }) => {
  const [lotes, setLotes] = useState(1);
  const [porConta, setPorConta] = useState(!receita.temInsumos);
  const [imediato, setImediato] = useState(false);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { mesaId } = useMesa();
  const total = receita.quantidadeResultado * lotes;

  const produzir = async () => {
    setEnviando(true);
    try {
      const r = await comercioService.produzir({ lojaId, receitaId: receita.id, lotes, insumosPorConta: porConta, imediato, mesaId, fichaId });
      const entregas = descreverEntregas(r.entregas);
      avisar(
        'sucesso',
        entregas
          ? `Pronto e entregue: ${entregas}.`
          : imediato
            ? `${total}× ${receita.resultadoNome} já está no estoque.`
            : `Ordem aberta: ${total}× ${receita.resultadoNome} em ${receita.dias} dia(s).`
      );
      onFeito(r.detalhe);
      onFechar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível abrir a ordem.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal aberto titulo={`Mandar fazer: ${receita.nome}`} icone={<Hammer className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={enviando}>
      <div className="space-y-4">
        <div>
          <label htmlFor="producao-lotes" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
            Lotes (cada um rende {receita.quantidadeResultado}× {receita.resultadoNome})
          </label>
          <input
            id="producao-lotes"
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={lotes}
            onChange={(e) => setLotes(Math.min(99, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
            className="campo font-mono w-32"
          />
        </div>

        <div className="rounded-lg bg-abismo/60 border border-linha p-3 text-xs space-y-1">
          <p className="font-cinzel text-pergaminho">Insumos para {lotes} lote(s)</p>
          {receita.insumos.map((i) => {
            const precisa = i.quantidade * lotes;
            const basta = i.emEstoque >= precisa;
            return (
              <p key={i.itemId} className={`flex items-center gap-1.5 ${basta ? 'text-texto-2' : 'text-red-300'}`}>
                {basta ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5" />}
                {precisa}× {i.nome} <span className="text-nevoa">(tem {i.emEstoque})</span>
              </p>
            );
          })}
          <p className="text-nevoa pt-1">Mão de obra: {formatarLatao(receita.maoDeObraLatao * lotes)}</p>
        </div>

        <CampoEncomendaPersonagem id="producao-ficha" fichaId={fichaId} onAlterar={setFichaId} dias={imediato ? 0 : receita.dias} />

        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer">
          <input type="checkbox" checked={porConta} onChange={(e) => setPorConta(e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
          <span className="text-xs text-texto-2">
            <strong className="font-cinzel text-pergaminho">O Mestre fornece os insumos</strong>
            <span className="block text-nevoa">Nada sai do estoque nem do caixa da loja (ex.: encomenda de um jogador com material próprio).</span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer">
          <input type="checkbox" checked={imediato} onChange={(e) => setImediato(e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
          <span className="text-xs text-texto-2">
            <strong className="font-cinzel text-pergaminho">Pronto agora</strong>
            <span className="block text-nevoa">Pula os {receita.dias} dia(s) de produção: o resultado entra no estoque na hora.</span>
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button id="btn-confirmar-producao" variant="gold" size="sm" icon={<Hammer className="w-3.5 h-3.5" />} loading={enviando} onClick={produzir}>
            {imediato ? `Fazer ${total} agora` : `Abrir ordem de ${total}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export interface AbaProducaoLojaProps {
  detalhe: DetalheLoja;
  onAtualizado: (d: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const AbaProducaoLoja: React.FC<AbaProducaoLojaProps> = ({ detalhe, onAtualizado, avisar }) => {
  const [escolhida, setEscolhida] = useState<ReceitaComercio | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [encomendando, setEncomendando] = useState(false);
  const [cancelando, setCancelando] = useState<OrdemComercio | null>(null);
  const [processando, setProcessando] = useState(false);
  const { mesaId, painel } = useMesa();
  const nomeFicha = (id: number | null | undefined) => painel?.fichas.find((f) => f.id === id)?.nome ?? `ficha #${id}`;

  const cancelar = async () => {
    if (!cancelando) return;
    setProcessando(true);
    try {
      onAtualizado(await comercioService.cancelar(detalhe.loja.id, cancelando.indice, mesaId));
      avisar('sucesso', 'Ordem cancelada. Peças prontas e materiais não usados voltaram à prateleira.');
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível cancelar.');
    } finally {
      setProcessando(false);
      setCancelando(null);
    }
  };
  const conhecidas = detalhe.receitas.filter((r) => r.conhecida);
  const visiveis = verTodas ? detalhe.receitas : conhecidas;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300">
            Na oficina ({detalhe.ordens.length}/{detalhe.ordensMax} da IA)
          </h3>
          <Button variant="gold" size="sm" icon={<Anvil className="w-3.5 h-3.5" />} onClick={() => setEncomendando(true)}>
            Encomendar arma
          </Button>
        </div>
        {detalhe.ordens.length === 0 ? (
          <p className="text-xs text-nevoa italic">Nada em produção.</p>
        ) : (
          <ul className="space-y-2">
            {detalhe.ordens.map((o, i) => {
              const faltam = Math.max(0, o.diaConclusao - detalhe.dia);
              return (
                <li key={`${o.receitaId}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 p-3 rounded-xl bg-painel border border-linha text-xs">
                  {o.origem === 'MESTRE' ? (
                    <Badge variant="gold" icon={<Crown className="w-3 h-3" />}>Mestre</Badge>
                  ) : (
                    <Badge variant="cyan" icon={<Bot className="w-3 h-3" />}>IA</Badge>
                  )}
                  <strong className="font-cinzel text-pergaminho">
                    {o.quantidade}× {o.resultadoNome}
                  </strong>
                  {o.mesaId != null && (
                    <span title="Encomenda de mesa: o prazo do jogador conta no relógio da mesa">
                      <Badge variant="purple">
                        Mesa {o.mesaNome ?? `#${o.mesaId}`}
                        {o.fichaId != null && ` · para ${nomeFicha(o.fichaId)}`}
                      </Badge>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-nevoa sm:ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    {o.prontaAguardando
                      ? `pronta, reservada até a mesa chegar ao dia ${o.diaConclusaoMesa}`
                      : o.mesaId != null
                        ? `loja termina no dia ${o.diaConclusao} do mundo · entrega no dia ${o.diaConclusaoMesa} da mesa`
                        : faltam === 0
                          ? 'fica pronto na virada do dia'
                          : `pronto no dia ${o.diaConclusao} (faltam ${faltam})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCancelando(o)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-red-300 hover:bg-red-500/10 cursor-pointer"
                    aria-label={`Cancelar ${o.resultadoNome}`}
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancelar
                  </button>
                  {o.etapas?.length > 0 && (
                    <ol className="basis-full flex flex-wrap gap-1.5">
                      {o.etapas.map((e, k) => {
                        const pronta = e.estado !== 'PENDENTE';
                        return (
                          <li
                            key={k}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] ${pronta ? 'border-emerald-700/50 bg-emerald-950/30 text-emerald-200' : 'border-linha text-nevoa'}`}
                            title={pronta ? 'Pronta e reservada para esta encomenda (não vende)' : `Fica pronta no dia ${e.dia}`}
                          >
                            {pronta ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {e.componente}
                            {e.estado === 'DA_PRATELEIRA' && <span className="text-nevoa">(da prateleira)</span>}
                            {!pronta && <span className="font-mono">dia {e.dia}</span>}
                          </li>
                        );
                      })}
                      <li className="inline-flex items-center px-2 py-0.5 text-[11px] text-nevoa">→ montagem no dia {o.diaConclusao}</li>
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300">Receitas</h3>
          <label className="inline-flex items-center gap-2 text-xs text-texto-2 cursor-pointer">
            <input type="checkbox" checked={verTodas} onChange={(e) => setVerTodas(e.target.checked)} className="accent-amber-500 w-4 h-4" />
            Mostrar receitas de outras especialidades
          </label>
        </div>
        <p className="text-[11px] text-nevoa">
          A IA do mercador produz sozinha, todo dia, a receita da especialidade com maior lucro por dia. Aqui você manda fazer qualquer uma.
        </p>
        {visiveis.length === 0 ? (
          <EstadoVazio icone={<Hammer />} titulo="Nenhuma receita para esta loja">
            Cadastre receitas em Gerenciar → Receitas, escolhendo a especialidade em "Feita em".
          </EstadoVazio>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {visiveis.map((r) => (
              <li key={r.id} className="p-3 rounded-xl bg-painel border border-linha flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-cinzel text-sm font-bold text-pergaminho">{r.nome}</h4>
                    <span className="text-[11px] text-nevoa">
                      {r.quantidadeResultado}× {r.resultadoNome} · {r.dias} dia(s){!r.conhecida && ` · ${r.especialidade}`}
                      {r.etapas && r.etapas.length > 0 && ` · forja: ${r.etapas.join(', ')} + montagem`}
                    </span>
                  </div>
                  <span className={`shrink-0 font-mono text-xs ${r.lucroLatao > 0 ? 'text-emerald-300' : 'text-red-300'}`} title="Lucro estimado por lote, com os preços de hoje">
                    {r.lucroLatao > 0 ? '+' : ''}
                    {formatarLatao(r.lucroLatao)}
                  </span>
                </div>
                <p className="text-[11px] text-texto-2">
                  {r.insumos.map((i) => `${i.quantidade}× ${i.nome}`).join(' + ') || 'Sem insumos'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                  {r.temInsumos ? <Badge variant="cyan">Insumos em estoque</Badge> : <Badge variant="danger">Faltam insumos</Badge>}
                  {r.estoqueCheio && <Badge variant="muted">Prateleira cheia</Badge>}
                  {r.somenteEncomenda && <Badge variant="muted">Só por encomenda</Badge>}
                  {r.regional && r.liberadaAqui === false && (
                    <span title="Conhecimento regional que ainda não chegou à Produção nesta cidade: a IA não faz. Você ainda pode mandar fazer.">
                      <Badge variant="purple">Ainda não se sabe fazer aqui</Badge>
                    </span>
                  )}
                  <Button variant="outline" size="sm" className="ml-auto" icon={<Hammer className="w-3.5 h-3.5" />} onClick={() => setEscolhida(r)}>
                    Mandar fazer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {encomendando && <ModalEncomendarArma detalhe={detalhe} onFechar={() => setEncomendando(false)} onFeito={onAtualizado} avisar={avisar} />}
      <ModalConfirmacao
        aberto={!!cancelando}
        titulo="Cancelar ordem"
        textoConfirmar="Cancelar a ordem"
        perigoso
        carregando={processando}
        onConfirmar={cancelar}
        onCancelar={() => setCancelando(null)}
      >
        Cancelar <strong className="text-amber-300">{cancelando?.quantidade}× {cancelando?.resultadoNome}</strong>? As peças já prontas viram estoque comum (podem ser
        vendidas) e os materiais que ainda não viraram peça voltam à prateleira. A mão de obra paga não volta.
      </ModalConfirmacao>
      {escolhida && <ModalProduzir lojaId={detalhe.loja.id} receita={escolhida} onFechar={() => setEscolhida(null)} onFeito={onAtualizado} avisar={avisar} />}
    </div>
  );
};
