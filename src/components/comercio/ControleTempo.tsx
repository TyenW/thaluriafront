import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Flame, Globe, History, Settings2 } from 'lucide-react';
import { useMesa } from '../../contexts/MesaContext';
import { descreverEntregas, formatarMomento, mesasService } from '../../services/mesasService';
import type { ResultadoTempo } from '../../types/mesa';
import { Button } from '../common/Button';

export interface ControleTempoProps {
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
  /** Chamado depois que o tempo anda (a página recarrega o que mostra). */
  onTempoMudou?: () => void;
}

const PASSOS: { rotulo: string; horas: number }[] = [
  { rotulo: '+1 h', horas: 1 },
  { rotulo: '+4 h', horas: 4 },
  { rotulo: '+1 dia', horas: 24 },
  { rotulo: '+7 dias', horas: 24 * 7 },
];

/**
 * Relógio por mesa: o Mestre escolhe a mesa e avança o tempo dela. Se ela passar o mundo, o mercado
 * simula a diferença. Mostra os dois relógios e avisa quando a mesa está lendo o passado.
 * "Aquecer o mercado" anda só o mundo (nenhuma mesa muda de dia).
 */
export const ControleTempo: React.FC<ControleTempoProps> = ({ avisar, onTempoMudou }) => {
  const { painel, mesa, escolherMesa, aplicarPainel, erro } = useMesa();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [diasAquecer, setDiasAquecer] = useState(7);

  const concluir = (r: ResultadoTempo, texto: string) => {
    aplicarPainel(r.painel);
    const entregas = descreverEntregas(r.entregas);
    avisar('sucesso', entregas ? `${texto} Encomendas entregues: ${entregas}.` : texto);
    onTempoMudou?.();
  };

  const avancar = async (horas: number, rotulo: string) => {
    if (!mesa) return;
    setOcupado(rotulo);
    try {
      const r = await mesasService.avancar(mesa.id, horas);
      const mundo = r.mundoAndouHoras > 0 ? ` O mundo andou junto até o ${formatarMomento(r.mundoDia, r.mundoHora)}.` : '';
      concluir(r, `Mesa ${mesa.nome} agora no ${formatarMomento(r.mesa?.dia, r.mesa?.hora)}.${mundo}`);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível avançar o tempo.');
    } finally {
      setOcupado(null);
    }
  };

  const aquecer = async () => {
    setOcupado('aquecer');
    try {
      const r = await mesasService.simular(diasAquecer);
      concluir(r, `Mercado simulado por ${diasAquecer} dia(s): o mundo está no ${formatarMomento(r.mundoDia, r.mundoHora)}. Nenhuma mesa mudou de dia.`);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível simular o mercado.');
    } finally {
      setOcupado(null);
    }
  };

  if (erro && !painel) {
    return (
      <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200">
        <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
      </p>
    );
  }
  if (!painel) return <div className="h-24 rounded-xl bg-painel border border-linha animate-pulse" aria-busy="true" />;

  const ativas = painel.mesas.filter((m) => m.status === 'ATIVA');

  return (
    <section aria-label="Controle do tempo" className="p-3 sm:p-4 rounded-xl bg-painel border border-linha space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="min-w-0 sm:w-56">
          <label htmlFor="controle-mesa" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
            Mesa
          </label>
          <select id="controle-mesa" value={mesa?.id ?? ''} onChange={(e) => escolherMesa(Number(e.target.value) || null)} className="campo">
            {ativas.length === 0 && <option value="">Nenhuma mesa ativa</option>}
            {ativas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} — {formatarMomento(m.dia, m.hora)}
              </option>
            ))}
          </select>
        </div>

        <dl className="flex flex-wrap gap-2 text-xs">
          <div className={`rounded-lg border px-3 py-1.5 ${mesa?.noPassado ? 'border-amber-500/50 bg-amber-950/30' : 'border-linha bg-abismo/70'}`}>
            <dt className="flex items-center gap-1 text-[10px] font-cinzel uppercase tracking-wider text-nevoa">
              <Clock className="w-3 h-3" /> Mesa
            </dt>
            <dd className="font-mono text-pergaminho">{mesa ? formatarMomento(mesa.dia, mesa.hora) : '—'}</dd>
          </div>
          <div className="rounded-lg border border-linha bg-abismo/70 px-3 py-1.5">
            <dt className="flex items-center gap-1 text-[10px] font-cinzel uppercase tracking-wider text-nevoa">
              <Globe className="w-3 h-3" /> Mundo
            </dt>
            <dd className="font-mono text-pergaminho">{formatarMomento(painel.mundoDia, painel.mundoHora)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
          {PASSOS.map((p) => (
            <Button key={p.rotulo} variant="outline" size="sm" disabled={!mesa || !!ocupado} loading={ocupado === p.rotulo} onClick={() => avancar(p.horas, p.rotulo)}>
              {p.rotulo}
            </Button>
          ))}
          <Link to="/mestre/mesas" className="p-2 rounded-md border border-linha text-nevoa hover:text-amber-300 hover:border-amber-500/50" title="Gerenciar mesas" aria-label="Gerenciar mesas">
            <Settings2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {mesa?.noPassado && (
        <p role="status" className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs text-amber-100">
          <History className="w-4 h-4 shrink-0 text-amber-300" />
          <span>
            A mesa {mesa.nome} está {mesa.diasAtras} dia(s) atrás do mundo.{' '}
            {mesa.temSnapshot === false
              ? `Não há foto do mercado do dia ${mesa.dia}: ela lê o presente até alcançar o mundo.`
              : `Preços e estoque são os do dia ${mesa.dia} (foto do mercado).`}{' '}
            O que ela compra, vende ou encomenda acontece no mundo de agora; caravanas e escoltas só para a mesa no dia do mundo.
          </span>
        </p>
      )}

      <details className="text-xs text-nevoa">
        <summary className="cursor-pointer select-none hover:text-texto-2">Aquecer o mercado (só o mundo anda)</summary>
        <div className="flex flex-wrap items-end gap-2 pt-2">
          <label className="text-[11px] text-texto-2">
            Dias
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              value={diasAquecer}
              onChange={(e) => setDiasAquecer(Math.min(365, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
              className="campo font-mono w-24 mt-1"
            />
          </label>
          <Button variant="dark" size="sm" icon={<Flame className="w-3.5 h-3.5" />} loading={ocupado === 'aquecer'} disabled={!!ocupado} onClick={aquecer}>
            Simular mercado
          </Button>
          <span className="basis-full sm:basis-auto text-[11px]">Lojas vendem, produzem e encomendam; nenhuma mesa muda de dia e nenhum saber se espalha. Todas as mesas passam a ler fotos do mercado.</span>
        </div>
      </details>
    </section>
  );
};
