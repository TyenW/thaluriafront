import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Layers, Plus, Save, Trash2, X } from 'lucide-react';
import type { CategoriaMaterial, MoldeArma, OpcaoParte, ParteMolde } from '../../types/forja';
import type { TipoLoja } from '../../types/comercio';
import { forjaService } from '../../services/forjaService';
import { adminService } from '../../services/adminService';
import { ROTULO_TIPO_LOJA } from '../../utils/formatadores';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ROTULO_CATEGORIA, rotuloOpcao } from './SeletorMateriais';

export interface EditorMoldeProps {
  molde: MoldeArma | null;
  categorias: CategoriaMaterial[];
  onFechar: () => void;
  onSalvo: () => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

const rotuloCampo = 'block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1';
const inteiro = (v: string) => Math.floor(Number(v) || 0);

const NumeroPequeno: React.FC<{ rotulo: string; valor: number; onMudar: (n: number) => void; min?: number }> = ({ rotulo, valor, onMudar, min }) => (
  <label className="flex flex-col text-[10px] text-nevoa">
    {rotulo}
    <input type="number" value={valor} min={min} onChange={(e) => onMudar(inteiro(e.target.value))} className="campo font-mono !py-1 !px-1.5 w-16 text-center text-xs" />
  </label>
);

/**
 * Molde de uma família de arma: as partes, quantos materiais cada uma consome, quanto tempo leva
 * e o que aceita (categorias ou itens específicos, cada opção com bônus que só vale naquela parte).
 */
export const EditorMolde: React.FC<EditorMoldeProps> = ({ molde, categorias, onFechar, onSalvo, avisar }) => {
  const [m, setM] = useState<MoldeArma>(
    molde ? structuredClone(molde) : { id: 0, nome: '', tipoLoja: 'FORJA', slotsEfeito: 1, tempoMontagemHoras: 8, partes: [{ id: 0, nome: 'Lâmina', qtdMateriais: 2, tempoHoras: 16, opcoes: [] }] }
  );
  const [itens, setItens] = useState<{ id: number; nome: string }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .listar('itens')
      .then((lista) => setItens(lista.filter((i) => i.tipo !== 'COMPONENTE_ARMA').map((i) => ({ id: Number(i.id), nome: String(i.nome) }))))
      .catch(() => setItens([]));
  }, []);

  const mudarParte = (i: number, parcial: Partial<ParteMolde>) => setM((a) => ({ ...a, partes: a.partes.map((p, j) => (j === i ? { ...p, ...parcial } : p)) }));
  const mudarOpcao = (i: number, k: number, parcial: Partial<OpcaoParte>) =>
    mudarParte(i, { opcoes: m.partes[i].opcoes.map((o, j) => (j === k ? { ...o, ...parcial } : o)) });
  const mover = (i: number, d: number) =>
    setM((a) => {
      const partes = [...a.partes];
      [partes[i], partes[i + d]] = [partes[i + d], partes[i]];
      return { ...a, partes };
    });

  const adicionarOpcao = (i: number, valor: string) => {
    if (!valor) return;
    const [tipo, id] = valor.split(':');
    const nova: OpcaoParte =
      tipo === 'c'
        ? { categoria: id as CategoriaMaterial, itemId: null, bonusDano: 0, bonusDurabilidade: 0, bonusAlcanceM: 0 }
        : { categoria: null, itemId: Number(id), itemNome: itens.find((x) => x.id === Number(id))?.nome, bonusDano: 0, bonusDurabilidade: 0, bonusAlcanceM: 0 };
    mudarParte(i, { opcoes: [...m.partes[i].opcoes, nova] });
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await forjaService.salvarMolde(m);
      avisar('sucesso', `Molde "${m.nome}" salvo. As armas dele foram recalculadas.`);
      onSalvo();
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal aberto titulo={molde ? `Molde: ${molde.nome}` : 'Novo molde de arma'} icone={<Layers className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={salvando} tamanho="xl">
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="md-nome" className={rotuloCampo}>
              Família <span className="text-red-300">*</span>
            </label>
            <input id="md-nome" value={m.nome} onChange={(e) => setM({ ...m, nome: e.target.value })} placeholder="Ex.: Espada" className="campo" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="md-loja" className={rotuloCampo}>
              Feita em
            </label>
            <select id="md-loja" value={m.tipoLoja} onChange={(e) => setM({ ...m, tipoLoja: e.target.value as TipoLoja })} className="campo">
              {(Object.keys(ROTULO_TIPO_LOJA) as TipoLoja[]).map((k) => (
                <option key={k} value={k}>
                  {ROTULO_TIPO_LOJA[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="md-slots" className={rotuloCampo}>
              Slots de efeito
            </label>
            <input id="md-slots" type="number" min={0} max={20} value={m.slotsEfeito} onChange={(e) => setM({ ...m, slotsEfeito: inteiro(e.target.value) })} className="campo font-mono" />
          </div>
          <div>
            <label htmlFor="md-montagem" className={rotuloCampo}>
              Montagem (horas)
            </label>
            <input id="md-montagem" type="number" min={0} value={m.tempoMontagemHoras} onChange={(e) => setM({ ...m, tempoMontagemHoras: Number(e.target.value) || 0 })} className="campo font-mono" />
          </div>
        </div>

        <section className="space-y-2.5">
          <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300">Partes (subcraft de cada uma, na ordem)</h4>
          {m.partes.map((p, i) => (
            <div key={i} className="rounded-xl border border-linha bg-abismo/60 p-3 space-y-2.5">
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col text-[10px] text-nevoa flex-1 min-w-36">
                  Parte
                  <input value={p.nome} onChange={(e) => mudarParte(i, { nome: e.target.value })} placeholder="Ex.: Guarda" className="campo !py-1.5 text-sm" />
                </label>
                <NumeroPequeno rotulo="Materiais" valor={p.qtdMateriais} min={1} onMudar={(n) => mudarParte(i, { qtdMateriais: Math.max(1, n) })} />
                <NumeroPequeno rotulo="Horas" valor={p.tempoHoras} min={0} onMudar={(n) => mudarParte(i, { tempoHoras: Math.max(0, n) })} />
                <span className="flex gap-0.5 ml-auto">
                  <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir parte" className="p-1.5 text-nevoa hover:text-pergaminho disabled:opacity-30 cursor-pointer">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button type="button" disabled={i === m.partes.length - 1} onClick={() => mover(i, 1)} aria-label="Descer parte" className="p-1.5 text-nevoa hover:text-pergaminho disabled:opacity-30 cursor-pointer">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setM({ ...m, partes: m.partes.filter((_, j) => j !== i) })} aria-label={`Remover ${p.nome}`} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </span>
              </div>

              <ul className="space-y-1.5">
                {p.opcoes.map((o, k) => (
                  <li key={k} className="flex flex-wrap items-end gap-2 pl-2 border-l-2 border-ouro/30">
                    <span className="text-xs text-pergaminho min-w-28 pb-1.5">
                      {o.itemId != null ? <span className="text-amber-300">{rotuloOpcao(o)}</span> : `Qualquer ${rotuloOpcao(o).toLowerCase()}`}
                    </span>
                    <NumeroPequeno rotulo="+ Dano" valor={o.bonusDano} onMudar={(n) => mudarOpcao(i, k, { bonusDano: n })} />
                    <NumeroPequeno rotulo="+ Durab." valor={o.bonusDurabilidade} onMudar={(n) => mudarOpcao(i, k, { bonusDurabilidade: n })} />
                    <NumeroPequeno rotulo="+ Alcance m" valor={o.bonusAlcanceM} onMudar={(n) => mudarOpcao(i, k, { bonusAlcanceM: n })} />
                    <button type="button" onClick={() => mudarParte(i, { opcoes: p.opcoes.filter((_, j) => j !== k) })} aria-label="Remover opção" className="p-1.5 text-nevoa hover:text-red-300 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <select aria-label={`Aceitar em ${p.nome}`} value="" onChange={(e) => adicionarOpcao(i, e.target.value)} className="campo !py-1.5 text-xs max-w-xs">
                <option value="">+ Aceitar nesta parte…</option>
                <optgroup label="Categoria de material">
                  {categorias
                    .filter((c) => !p.opcoes.some((o) => o.categoria === c))
                    .map((c) => (
                      <option key={c} value={`c:${c}`}>
                        Qualquer {ROTULO_CATEGORIA[c].toLowerCase()}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Item específico (ex.: seda única)">
                  {itens
                    .filter((it) => !p.opcoes.some((o) => o.itemId === it.id))
                    .map((it) => (
                      <option key={it.id} value={`i:${it.id}`}>
                        {it.nome}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          ))}
          <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setM({ ...m, partes: [...m.partes, { id: 0, nome: '', qtdMateriais: 1, tempoHoras: 4, opcoes: [] }] })}>
            Adicionar parte
          </Button>
          <p className="text-[11px] text-nevoa">
            O bônus de uma opção vale só naquela parte (ex.: a Seda da Aranha-Tecelã dá +20 m de alcance como Corda). Uma liga usa a média dos bônus dos metais.
          </p>
        </section>

        {erro && (
          <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-100">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={salvar} disabled={!m.nome.trim()}>
            Salvar molde
          </Button>
        </div>
      </div>
    </Modal>
  );
};
