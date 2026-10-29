import React, { useState } from 'react';
import { Archive, ArchiveRestore, ArrowRightLeft, Check, Dices, History, Pencil, Plus, RefreshCw, Users } from 'lucide-react';
import type { FichaNaMesa, Mesa } from '../../types/mesa';
import { formatarMomento, mesasService } from '../../services/mesasService';
import { useMesa } from '../../contexts/MesaContext';
import { CabecalhoPagina } from '../../components/common/CabecalhoPagina';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EstadoVazio } from '../../components/common/EstadoVazio';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';
import { ControleTempo } from '../../components/comercio/ControleTempo';
import { ModalTrocarMesa } from '../../components/mesas/ModalTrocarMesa';

/** Cartão de uma mesa: relógio, situação em relação ao mundo e ações. */
const CartaoMesa: React.FC<{
  m: Mesa;
  escolhida: boolean;
  onEscolher: () => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}> = ({ m, escolhida, onEscolher, avisar }) => {
  const { aplicarPainel } = useMesa();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(m.nome);
  const [ocupado, setOcupado] = useState(false);
  const arquivada = m.status === 'ARQUIVADA';

  const executar = async (acao: () => Promise<void>) => {
    setOcupado(true);
    try {
      await acao();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível concluir.');
    } finally {
      setOcupado(false);
    }
  };

  const renomear = () =>
    executar(async () => {
      aplicarPainel(await mesasService.renomear(m.id, nome.trim()));
      setEditando(false);
      avisar('sucesso', `Mesa renomeada para ${nome.trim()}.`);
    });

  const alternarStatus = () =>
    executar(async () => {
      const r = await mesasService.definirStatus(m.id, arquivada ? 'ATIVA' : 'ARQUIVADA');
      aplicarPainel(r.painel);
      if (r.aviso) avisar('erro', r.aviso);
      else avisar('sucesso', arquivada ? `Mesa ${m.nome} reativada.` : `Mesa ${m.nome} arquivada: não puxa o mundo nem segura fotos do mercado.`);
    });

  return (
    <li className={`p-4 rounded-xl border flex flex-col gap-3 ${escolhida ? 'bg-amber-950/20 border-amber-500/60' : 'bg-painel border-linha'} ${arquivada ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        {editando ? (
          <form
            className="flex items-center gap-1.5 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              renomear();
            }}
          >
            <label className="sr-only" htmlFor={`mesa-nome-${m.id}`}>
              Nome da mesa
            </label>
            <input id={`mesa-nome-${m.id}`} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} className="campo" autoFocus />
            <Button type="submit" variant="gold" size="sm" icon={<Check className="w-3.5 h-3.5" />} loading={ocupado} disabled={!nome.trim()}>
              Salvar
            </Button>
          </form>
        ) : (
          <h3 className="font-cinzel text-lg font-bold text-pergaminho break-words">{m.nome}</h3>
        )}
        <div className="flex flex-wrap gap-1 shrink-0">
          {escolhida && <Badge variant="gold">Escolhida</Badge>}
          {arquivada ? <Badge variant="muted">Arquivada</Badge> : m.noPassado ? <Badge variant="purple">{m.diasAtras} dia(s) atrás</Badge> : <Badge variant="cyan">No dia do mundo</Badge>}
        </div>
      </div>
      <p className="text-xs text-texto-2">
        <span className="font-mono text-pergaminho">{formatarMomento(m.dia, m.hora)}</span> · {m.personagens ?? 0} personagem(ns)
        {m.noPassado && !arquivada && (m.temSnapshot === false ? ' · sem foto do mercado: lê o presente' : ' · lê a foto do mercado do dia dela')}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {!arquivada && !escolhida && (
          <Button variant="outline" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={onEscolher}>
            Escolher
          </Button>
        )}
        {!editando && (
          <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditando(true)}>
            Renomear
          </Button>
        )}
        <Button variant="ghost" size="sm" icon={arquivada ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />} loading={ocupado && !editando} onClick={alternarStatus}>
          {arquivada ? 'Reativar' : 'Arquivar'}
        </Button>
      </div>
    </li>
  );
};

/**
 * Mesas e linhas do tempo: várias mesas, cada uma no seu dia, no mesmo mundo. O mundo segue a mesa
 * ativa mais à frente; uma mesa atrasada lê a foto do mercado do dia dela e age no presente.
 */
export const MesasPage: React.FC = () => {
  const { painel, mesa, escolherMesa, aplicarPainel, recarregar } = useMesa();
  const { avisos, avisar, fechar } = useAvisos();
  const [novoNome, setNovoNome] = useState('');
  const [novoDia, setNovoDia] = useState('');
  const [criando, setCriando] = useState(false);
  const [trocando, setTrocando] = useState<FichaNaMesa | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const nomeMesa = (id: number | null) => (id == null ? null : painel?.mesas.find((m) => m.id === id)?.nome ?? `#${id}`);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriando(true);
    try {
      const dia = novoDia.trim() ? Number(novoDia) : undefined;
      const r = await mesasService.criar(novoNome.trim(), dia);
      aplicarPainel(r.painel);
      escolherMesa(r.id);
      setNovoNome('');
      setNovoDia('');
      if (r.aviso) avisar('erro', r.aviso);
      else avisar('sucesso', `Mesa ${novoNome.trim()} criada.`);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível criar a mesa.');
    } finally {
      setCriando(false);
    }
  };

  const atualizar = async () => {
    setAtualizando(true);
    await recarregar();
    setAtualizando(false);
  };

  return (
    <div className="space-y-6 text-left pb-16">
      <CabecalhoPagina
        icone={<Dices />}
        titulo="Mesas"
        descricao="Cada mesa tem o seu dia e hora, no mesmo mundo. O mercado anda com a mesa mais à frente; uma mesa atrasada vê preços e estoque do dia dela, mas compra, vende e encomenda no mundo de agora."
        acoes={
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={atualizar} loading={atualizando}>
            Atualizar
          </Button>
        }
      />

      <ControleTempo avisar={avisar} />

      {painel && (
        <>
          <section className="space-y-3" aria-labelledby="titulo-mesas">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="titulo-mesas" className="font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300">
                Mesas ({painel.mesas.length})
              </h2>
              <span className="text-[11px] text-nevoa">
                Fotos do mercado guardadas: {painel.snapshotsDe ? `dia ${painel.snapshotsDe} a ${painel.snapshotsAte}` : 'nenhuma'} · campanha no dia {painel.diaCampanha}
              </span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {painel.mesas.map((m) => (
                <CartaoMesa key={m.id} m={m} escolhida={mesa?.id === m.id} onEscolher={() => escolherMesa(m.id)} avisar={avisar} />
              ))}
            </ul>
            <form onSubmit={criar} className="flex flex-col sm:flex-row sm:items-end gap-2 p-3 rounded-xl border border-dashed border-linha-forte">
              <div className="flex-1">
                <label htmlFor="nova-mesa-nome" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
                  Nova mesa
                </label>
                <input id="nova-mesa-nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} maxLength={60} placeholder="Ex.: Norte" className="campo" />
              </div>
              <div className="sm:w-40">
                <label htmlFor="nova-mesa-dia" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
                  Dia (opcional)
                </label>
                <input
                  id="nova-mesa-dia"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={novoDia}
                  onChange={(e) => setNovoDia(e.target.value)}
                  placeholder={`Mundo: ${painel.mundoDia}`}
                  className="campo font-mono"
                />
              </div>
              <Button type="submit" variant="gold" size="sm" icon={<Plus className="w-3.5 h-3.5" />} loading={criando} disabled={!novoNome.trim()}>
                Criar mesa
              </Button>
            </form>
          </section>

          <section className="space-y-3" aria-labelledby="titulo-personagens">
            <h2 id="titulo-personagens" className="font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300">
              Personagens ({painel.fichas.length})
            </h2>
            {painel.fichas.length === 0 ? (
              <EstadoVazio icone={<Users />} titulo="Nenhuma ficha">
                As fichas criadas pelos jogadores aparecem aqui.
              </EstadoVazio>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-linha">
                <table className="w-full text-xs">
                  <thead className="bg-painel-alto text-left font-cinzel uppercase tracking-wider text-[10px] text-nevoa">
                    <tr>
                      <th scope="col" className="px-3 py-2">Personagem</th>
                      <th scope="col" className="px-3 py-2">Mesa</th>
                      <th scope="col" className="px-3 py-2">Já viveu até</th>
                      <th scope="col" className="px-3 py-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {painel.fichas.map((f) => (
                      <tr key={f.id} className="border-t border-linha">
                        <td className="px-3 py-2">
                          <span className="font-cinzel text-pergaminho">{f.nome}</span> <span className="text-nevoa">({f.raca})</span>
                        </td>
                        <td className="px-3 py-2">{f.mesaId != null ? nomeMesa(f.mesaId) : <span className="text-nevoa italic">Fora de jogo</span>}</td>
                        <td className="px-3 py-2 font-mono">{formatarMomento(f.dia, f.hora)}</td>
                        <td className="px-3 py-2 text-right">
                          <Button variant="outline" size="sm" icon={<ArrowRightLeft className="w-3.5 h-3.5" />} onClick={() => setTrocando(f)}>
                            Trocar de mesa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {painel.trocas.length > 0 && (
            <section className="space-y-2" aria-labelledby="titulo-trocas">
              <h2 id="titulo-trocas" className="flex items-center gap-1.5 font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300">
                <History className="w-3.5 h-3.5" /> Trocas recentes
              </h2>
              <ul className="space-y-1 text-xs">
                {painel.trocas.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-lg bg-painel border border-linha">
                    <span className="font-cinzel text-pergaminho">{t.fichaNome ?? `Ficha #${t.fichaId}`}</span>
                    <span className="text-nevoa">
                      {nomeMesa(t.mesaOrigemId) ?? 'fora de jogo'} → {nomeMesa(t.mesaDestinoId) ?? 'fora de jogo'}
                    </span>
                    {t.forcada && <Badge variant="danger">Forçada: personagem no {formatarMomento(t.diaPersonagem, t.horaPersonagem)}, mesa no {formatarMomento(t.diaMesa, t.horaMesa)}</Badge>}
                    <span className="ml-auto text-[10px] font-mono text-apagado">{t.registradoEm}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {trocando && <ModalTrocarMesa ficha={trocando} onFechar={() => setTrocando(null)} avisar={avisar} />}
      <PainelAvisos avisos={avisos} onFechar={fechar} />
    </div>
  );
};
