import React, { useState } from 'react';
import { AlertTriangle, ArrowRightLeft } from 'lucide-react';
import type { FichaNaMesa } from '../../types/mesa';
import { descreverEntregas, formatarMomento, mesasService } from '../../services/mesasService';
import { useMesa } from '../../contexts/MesaContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export interface ModalTrocarMesaProps {
  ficha: FichaNaMesa;
  onFechar: () => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

const momento = (dia: number | null, hora: number | null) => (dia == null ? 0 : dia * 24 + (hora ?? 0));

/**
 * Troca de mesa só para frente: o personagem entra numa mesa cujo relógio é igual ou maior que o
 * dele. Para trás seria viagem no tempo; o Mestre pode forçar, e a troca forçada fica registrada.
 */
export const ModalTrocarMesa: React.FC<ModalTrocarMesaProps> = ({ ficha, onFechar, avisar }) => {
  const { painel, aplicarPainel } = useMesa();
  const opcoes = (painel?.mesas ?? []).filter((m) => m.status === 'ATIVA' && m.id !== ficha.mesaId);
  const [destinoId, setDestinoId] = useState<string>(opcoes[0] ? String(opcoes[0].id) : '');
  const [forcar, setForcar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const destino = opcoes.find((m) => String(m.id) === destinoId) ?? null;
  const paraTras = !!destino && ficha.dia != null && momento(destino.dia, destino.hora) < momento(ficha.dia, ficha.hora);
  const atual = painel?.mesas.find((m) => m.id === ficha.mesaId);

  const trocar = async () => {
    setEnviando(true);
    try {
      const r = await mesasService.trocar(ficha.id, destino?.id ?? null, forcar);
      aplicarPainel(r.painel);
      const entregas = descreverEntregas(r.entregas);
      avisar(
        'sucesso',
        (destino ? `${ficha.nome} entrou na mesa ${destino.nome}${r.forcada ? ' (troca forçada, registrada)' : ''}.` : `${ficha.nome} saiu de jogo.`) +
          (entregas ? ` Encomendas entregues: ${entregas}.` : '')
      );
      onFechar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível trocar de mesa.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal aberto titulo={`Trocar ${ficha.nome} de mesa`} icone={<ArrowRightLeft className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={enviando}>
      <div className="space-y-4">
        <p className="text-xs text-texto-2">
          Hoje: {atual ? `mesa ${atual.nome}` : 'fora de jogo'}. O personagem já viveu até o{' '}
          <strong className="font-mono text-pergaminho">{formatarMomento(ficha.dia, ficha.hora)}</strong>.
        </p>
        <div>
          <label htmlFor="troca-destino" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
            Para
          </label>
          <select
            id="troca-destino"
            value={destinoId}
            onChange={(e) => {
              setDestinoId(e.target.value);
              setForcar(false);
            }}
            className="campo"
          >
            {opcoes.map((m) => (
              <option key={m.id} value={m.id}>
                Mesa {m.nome} — {formatarMomento(m.dia, m.hora)}
              </option>
            ))}
            {ficha.mesaId != null && <option value="">Fora de jogo</option>}
          </select>
        </div>

        {destino && !paraTras && (
          <p className="text-[11px] text-nevoa">
            O relógio do personagem vai para o {formatarMomento(destino.dia, destino.hora)}. As encomendas dele passam a seguir esta mesa; o que vencia no
            intervalo já fica pronto.
          </p>
        )}
        {paraTras && (
          <div role="alert" className="space-y-2 p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-100">
            <p className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-300" />
              A mesa {destino.nome} está no {formatarMomento(destino.dia, destino.hora)}, antes do que o personagem já viveu. Entrar nela seria voltar no tempo.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={forcar} onChange={(e) => setForcar(e.target.checked)} className="accent-red-500 w-4 h-4" />
              Forçar mesmo assim (a troca fica registrada)
            </label>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant={paraTras ? 'danger' : 'gold'}
            size="sm"
            icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            loading={enviando}
            disabled={(opcoes.length === 0 && ficha.mesaId == null) || (paraTras && !forcar)}
            onClick={trocar}
          >
            {destino ? (paraTras ? 'Forçar troca' : 'Trocar') : 'Tirar de jogo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
