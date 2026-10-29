import React from 'react';
import { useMesa } from '../../contexts/MesaContext';

export interface CampoEncomendaPersonagemProps {
  id: string;
  fichaId: number | null;
  onAlterar: (fichaId: number | null) => void;
  /** Dias de produção, para mostrar o prazo no relógio da mesa. */
  dias?: number;
}

/**
 * Para quem é a encomenda. Com um personagem da mesa escolhida, o prazo conta no relógio da mesa
 * e a peça vai direto para a ficha quando a mesa chegar lá, mesmo que a loja ainda não tenha terminado.
 */
export const CampoEncomendaPersonagem: React.FC<CampoEncomendaPersonagemProps> = ({ id, fichaId, onAlterar, dias }) => {
  const { painel, mesa } = useMesa();
  const daMesa = (painel?.fichas ?? []).filter((f) => mesa && f.mesaId === mesa.id);

  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
        Encomenda de personagem
      </label>
      <select id={id} value={fichaId ?? ''} onChange={(e) => onAlterar(Number(e.target.value) || null)} className="campo" disabled={!mesa}>
        <option value="">Ninguém: a loja produz para o balcão</option>
        {daMesa.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome} ({f.raca})
          </option>
        ))}
      </select>
      <p className="text-[11px] text-nevoa mt-1">
        {!mesa
          ? 'Escolha uma mesa no controle do tempo para encomendar em nome de um personagem.'
          : fichaId
            ? `Prazo do jogador: dia ${mesa.dia + (dias ?? 0)} da mesa ${mesa.nome}. A peça vai para a ficha quando a mesa chegar lá.`
            : `Só aparecem personagens da mesa ${mesa.nome}.${daMesa.length === 0 ? ' Ela ainda não tem nenhum (veja Mesas).' : ''}`}
      </p>
    </div>
  );
};
