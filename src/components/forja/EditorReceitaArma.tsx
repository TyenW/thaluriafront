import React, { useState } from 'react';
import { AlertTriangle, Save, Sword } from 'lucide-react';
import type { ArmaCalculada, EscolhaMaterial, PainelForja, ReceitaArma } from '../../types/forja';
import { forjaService } from '../../services/forjaService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { PreviaArma } from './PreviaArma';
import { SeletorMateriais } from './SeletorMateriais';

export interface EditorReceitaArmaProps {
  painel: PainelForja;
  receita: ReceitaArma | null;
  onFechar: () => void;
  onSalvo: () => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

const rotuloCampo = 'block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1';

/** Receita pronta de arma: tipo + um material para cada parte. É o que as forjas fabricam sozinhas. */
export const EditorReceitaArma: React.FC<EditorReceitaArmaProps> = ({ painel, receita, onFechar, onSalvo, avisar }) => {
  const [nome, setNome] = useState(receita?.nome ?? '');
  const [tipoArmaId, setTipoArmaId] = useState<number | null>(receita?.tipoArmaId ?? null);
  const [escolhas, setEscolhas] = useState<EscolhaMaterial[]>(receita?.materiais ?? []);
  const [somenteEncomenda, setSomenteEncomenda] = useState(receita?.somenteEncomenda ?? false);
  const [descricao, setDescricao] = useState(receita?.descricao ?? '');
  const [arma, setArma] = useState<ArmaCalculada | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const tipo = painel.tipos.find((t) => t.id === tipoArmaId);
  const molde = tipo ? painel.moldes.find((m) => m.id === tipo.moldeId) : undefined;

  const trocarTipo = (id: number | null) => {
    const novo = painel.tipos.find((t) => t.id === id);
    // Outro molde tem outras partes: as escolhas antigas não servem mais
    if (!novo || novo.moldeId !== tipo?.moldeId) setEscolhas([]);
    setTipoArmaId(id);
  };

  const salvar = async () => {
    if (!nome.trim() || !tipoArmaId) {
      setErro('Dê um nome e escolha o tipo de arma.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await forjaService.salvarReceita({ id: receita?.id, nome: nome.trim(), tipoArmaId, materiais: escolhas, somenteEncomenda, descricao });
      avisar('sucesso', `Receita "${nome.trim()}" salva. As forjas já a conhecem.`);
      onSalvo();
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal aberto titulo={receita ? `Editar: ${receita.nome}` : 'Nova receita de arma'} icone={<Sword className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={salvando} tamanho="xl">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-5">
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ra-nome" className={rotuloCampo}>
                Nome da arma <span className="text-red-300">*</span>
              </label>
              <input id="ra-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Katana de Aço Negro" className="campo" />
            </div>
            <div>
              <label htmlFor="ra-tipo" className={rotuloCampo}>
                Tipo de arma <span className="text-red-300">*</span>
              </label>
              <select id="ra-tipo" value={tipoArmaId ?? ''} onChange={(e) => trocarTipo(Number(e.target.value) || null)} className="campo">
                <option value="">Selecione…</option>
                {painel.moldes.map((m) => (
                  <optgroup key={m.id} label={m.nome}>
                    {painel.tipos
                      .filter((t) => t.moldeId === m.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome} ({t.qtdDados}d{t.facesDado})
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {molde ? (
            <SeletorMateriais molde={molde} materiais={painel.materiais} escolhas={escolhas} onAlterar={setEscolhas} />
          ) : (
            <p className="text-xs text-nevoa">Escolha o tipo para ver as partes do molde.</p>
          )}

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer">
            <input type="checkbox" checked={somenteEncomenda} onChange={(e) => setSomenteEncomenda(e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
            <span className="text-xs text-texto-2">
              <strong className="font-cinzel text-pergaminho">Só por encomenda</strong>
              <span className="block text-nevoa">A IA dos ferreiros não fabrica sozinha; só sai quando você manda fazer.</span>
            </span>
          </label>

          <div>
            <label htmlFor="ra-desc" className={rotuloCampo}>
              Descrição / lenda
            </label>
            <textarea id="ra-desc" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="campo" />
          </div>
        </div>

        <aside className="space-y-2 lg:sticky lg:top-4 self-start">
          <p className="text-[11px] font-cinzel font-bold uppercase tracking-widest text-nevoa">Como a arma sai</p>
          <PreviaArma tipoArmaId={tipoArmaId} escolhas={escolhas} nome={nome || undefined} onCalculada={setArma} />
        </aside>
      </div>

      {erro && (
        <p role="alert" className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-100">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 mt-4 border-t border-linha">
        <Button variant="ghost" size="sm" onClick={onFechar} disabled={salvando}>
          Cancelar
        </Button>
        <Button variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={salvar} disabled={!arma || arma.problemas.length > 0}>
          Salvar receita
        </Button>
      </div>
    </Modal>
  );
};
