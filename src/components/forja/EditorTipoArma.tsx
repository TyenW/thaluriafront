import React, { useState } from 'react';
import { AlertTriangle, Save, Swords } from 'lucide-react';
import type { MoldeArma, TipoArma } from '../../types/forja';
import { forjaService } from '../../services/forjaService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export interface EditorTipoArmaProps {
  moldes: MoldeArma[];
  tipo: TipoArma | null;
  onFechar: () => void;
  onSalvo: () => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

const rotuloCampo = 'block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1';
const numero = (v: string, min: number) => Math.max(min, Math.floor(Number(v) || 0));

/** Tipo de arma (Katana, Arco Longo...): o dado base, o alcance e o molde cujas partes usa. */
export const EditorTipoArma: React.FC<EditorTipoArmaProps> = ({ moldes, tipo, onFechar, onSalvo, avisar }) => {
  const [t, setT] = useState<TipoArma>(
    tipo ?? { id: 0, nome: '', moldeId: moldes[0]?.id ?? 0, tipoItem: 'ARMA_BRANCA', qtdDados: 1, facesDado: 6, alcanceM: 0 }
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = (parcial: Partial<TipoArma>) => setT((atual) => ({ ...atual, ...parcial }));

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await forjaService.salvarTipo(t);
      avisar('sucesso', `Tipo "${t.nome}" salvo.`);
      onSalvo();
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal aberto titulo={tipo ? `Editar: ${tipo.nome}` : 'Novo tipo de arma'} icone={<Swords className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={salvando}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ta-nome" className={rotuloCampo}>
              Nome <span className="text-red-300">*</span>
            </label>
            <input id="ta-nome" value={t.nome} onChange={(e) => mudar({ nome: e.target.value })} placeholder="Ex.: Katana" className="campo" />
          </div>
          <div>
            <label htmlFor="ta-molde" className={rotuloCampo}>
              Molde (partes)
            </label>
            <select id="ta-molde" value={t.moldeId} onChange={(e) => mudar({ moldeId: Number(e.target.value) })} className="campo">
              {moldes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}: {m.partes.map((p) => p.nome).join(', ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ta-item" className={rotuloCampo}>
              Combate
            </label>
            <select id="ta-item" value={t.tipoItem} onChange={(e) => mudar({ tipoItem: e.target.value as TipoArma['tipoItem'] })} className="campo">
              <option value="ARMA_BRANCA">Corpo a corpo</option>
              <option value="ARMA_LONGO_ALCANCE">Longo alcance</option>
            </select>
          </div>
          <div>
            <span className={rotuloCampo}>Dado base</span>
            <div className="flex items-center gap-1.5">
              <input aria-label="Quantidade de dados" type="number" min={1} max={20} value={t.qtdDados} onChange={(e) => mudar({ qtdDados: numero(e.target.value, 1) })} className="campo font-mono w-20 text-center" />
              <span className="font-cinzel text-pergaminho">d</span>
              <input aria-label="Faces do dado" type="number" min={2} max={100} value={t.facesDado} onChange={(e) => mudar({ facesDado: numero(e.target.value, 2) })} className="campo font-mono w-20 text-center" />
            </div>
          </div>
          <div>
            <label htmlFor="ta-alcance" className={rotuloCampo}>
              Alcance base (m)
            </label>
            <input id="ta-alcance" type="number" min={0} value={t.alcanceM} onChange={(e) => mudar({ alcanceM: numero(e.target.value, 0) })} className="campo font-mono" />
          </div>
        </div>

        {erro && (
          <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-100">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={salvar} disabled={!t.nome.trim()}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
