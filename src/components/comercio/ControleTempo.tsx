import React, { useState } from 'react';
import { CalendarClock, CalendarPlus, Hourglass, Store } from 'lucide-react';
import { mundoService, type ModoTempo, type RelogioMundo } from '../../services/mundoService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

const MAX_DIAS = 365;

const ATALHOS = [
  { dias: 1, rotulo: '1 dia' },
  { dias: 7, rotulo: '1 semana' },
  { dias: 30, rotulo: '1 mês' },
  { dias: 90, rotulo: '3 meses' },
  { dias: 365, rotulo: '1 ano' },
];

const MODOS: { id: ModoTempo; titulo: string; descricao: string; icone: React.ReactNode }[] = [
  {
    id: 'AVANCAR_DIA',
    titulo: 'Avançar a campanha',
    descricao: 'Os dias passam de verdade: o mercado trabalha e o conhecimento se espalha entre as cidades.',
    icone: <CalendarPlus className="w-4 h-4" />,
  },
  {
    id: 'SIMULAR_MERCADO',
    titulo: 'Só simular o mercado',
    descricao: 'Lojas vendem, produzem, entregam encomendas e caravanas viajam, mas o dia da campanha e a disseminação ficam parados. Bom para aquecer o mundo antes da primeira sessão.',
    icone: <Store className="w-4 h-4" />,
  },
];

const plural = (n: number) => `${n.toLocaleString('pt-BR')} dia${n === 1 ? '' : 's'}`;

export interface ControleTempoProps {
  diaCampanha: number | null;
  diaMercado: number | null;
  onPassou: (r: RelogioMundo, modo: ModoTempo, dias: number) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

/** "Avançar 1 dia" direto e "Passar tempo…" com escolha de modo e duração. */
export const ControleTempo: React.FC<ControleTempoProps> = ({ diaCampanha, diaMercado, onPassou, avisar }) => {
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<ModoTempo>('AVANCAR_DIA');
  const [texto, setTexto] = useState('7');
  const [rodando, setRodando] = useState<null | 'rapido' | 'modal'>(null);

  const dias = Number(texto);
  const erro = !/^\d+$/.test(texto.trim()) || dias < 1 ? 'Informe um número inteiro de dias.' : dias > MAX_DIAS ? `No máximo ${MAX_DIAS} dias por vez.` : null;
  const aFrente = diaCampanha != null && diaMercado != null ? diaMercado - diaCampanha : 0;

  const passar = async (m: ModoTempo, n: number, origem: 'rapido' | 'modal') => {
    setRodando(origem);
    try {
      const r = await mundoService.passarTempo(m, n);
      avisar(
        'sucesso',
        m === 'AVANCAR_DIA'
          ? `${plural(n)} se passaram. Agora é o dia ${r.diaAtual} da campanha.`
          : `O mercado trabalhou ${plural(n)}. A campanha segue no dia ${r.diaAtual}.`
      );
      onPassou(r, m, n);
      setAberto(false);
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível passar o tempo.');
    } finally {
      setRodando(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="gold" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />} loading={rodando === 'rapido'} disabled={!!rodando} onClick={() => passar('AVANCAR_DIA', 1, 'rapido')}>
          Avançar 1 dia
        </Button>
        <Button variant="outline" size="sm" icon={<CalendarClock className="w-3.5 h-3.5" />} disabled={!!rodando} onClick={() => setAberto(true)}>
          Passar tempo…
        </Button>
      </div>

      <Modal aberto={aberto} titulo="Passar o tempo" icone={<Hourglass className="w-5 h-5 text-amber-400" />} onFechar={() => setAberto(false)} bloqueado={!!rodando} tamanho="md">
        <div className="space-y-5">
          {diaCampanha != null && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-lg bg-abismo border border-linha">
                <span className="block text-[10px] font-cinzel uppercase tracking-wider text-nevoa">Campanha</span>
                <strong className="font-cinzel text-lg text-pergaminho">Dia {diaCampanha}</strong>
              </div>
              <div className="p-3 rounded-lg bg-abismo border border-linha">
                <span className="block text-[10px] font-cinzel uppercase tracking-wider text-nevoa">Mercado</span>
                <strong className="font-cinzel text-lg text-pergaminho">Dia {diaMercado ?? diaCampanha}</strong>
                {aFrente > 0 && <span className="block text-[10px] text-amber-300/90">{plural(aFrente)} à frente</span>}
              </div>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1.5">O que passa</legend>
            {MODOS.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  modo === m.id ? 'border-ouro/60 bg-ouro/10' : 'border-linha bg-abismo/50 hover:border-linha-forte'
                }`}
              >
                <input type="radio" name="modo-tempo" value={m.id} checked={modo === m.id} onChange={() => setModo(m.id)} className="mt-1 accent-amber-500" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-cinzel font-bold text-pergaminho">
                    <span className="text-amber-400">{m.icone}</span>
                    {m.titulo}
                  </span>
                  <span className="block text-[11px] text-nevoa mt-0.5">{m.descricao}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="input-dias-tempo" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90">
              Quanto tempo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ATALHOS.map((a) => (
                <button
                  key={a.dias}
                  type="button"
                  onClick={() => setTexto(String(a.dias))}
                  aria-pressed={dias === a.dias}
                  className={`px-3 py-1.5 rounded-full border text-xs font-cinzel font-bold transition-colors cursor-pointer ${
                    dias === a.dias ? 'border-ouro/60 bg-ouro/15 text-pergaminho' : 'border-linha-forte text-nevoa hover:text-texto'
                  }`}
                >
                  {a.rotulo}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="input-dias-tempo"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DIAS}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-invalid={!!erro}
                className="campo font-mono w-28"
              />
              <span className="text-xs text-nevoa">dias</span>
            </div>
            {erro && <p className="text-[11px] text-red-300">{erro}</p>}
          </div>

          {!erro && diaCampanha != null && (
            <p className="p-3 rounded-lg bg-abismo border border-linha text-xs text-texto-2" aria-live="polite">
              {modo === 'AVANCAR_DIA' ? (
                <>
                  A campanha vai do dia <strong className="text-pergaminho">{diaCampanha}</strong> para o <strong className="text-amber-300">{diaCampanha + dias}</strong>.
                </>
              ) : (
                <>
                  A campanha <strong className="text-pergaminho">continua no dia {diaCampanha}</strong>; o mercado trabalha {plural(dias)} (até o dia{' '}
                  <strong className="text-amber-300">{(diaMercado ?? diaCampanha) + dias}</strong>).
                </>
              )}
              {dias > 60 && <span className="block mt-1 text-nevoa">Períodos longos podem levar alguns segundos.</span>}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
            <Button variant="ghost" size="sm" onClick={() => setAberto(false)} disabled={!!rodando}>
              Cancelar
            </Button>
            <Button variant="gold" size="sm" loading={rodando === 'modal'} disabled={!!erro} onClick={() => passar(modo, dias, 'modal')}>
              {rodando === 'modal'
                ? `Simulando ${plural(dias)}…`
                : modo === 'AVANCAR_DIA'
                ? `Avançar ${plural(dias)}`
                : `Simular ${plural(dias)} de mercado`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
