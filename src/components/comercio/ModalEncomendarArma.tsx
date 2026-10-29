import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Anvil, Loader2 } from 'lucide-react';
import type { DetalheLoja } from '../../types/comercio';
import type { ArmaCalculada, EscolhaMaterial, PainelForja } from '../../types/forja';
import { forjaService } from '../../services/forjaService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { PreviaArma } from '../forja/PreviaArma';
import { SeletorMateriais } from '../forja/SeletorMateriais';
import { CampoEncomendaPersonagem } from './CampoEncomendaPersonagem';
import { descreverEntregas } from '../../services/mesasService';
import { useMesa } from '../../contexts/MesaContext';

export interface ModalEncomendarArmaProps {
  detalhe: DetalheLoja;
  onFechar: () => void;
  onFeito: (d: DetalheLoja) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

/**
 * Encomenda sob medida: o Mestre (ou o jogador, pela boca do Mestre) escolhe o tipo de arma e o
 * material de cada parte. As peças ficam prontas uma a uma, reservadas, e a montagem vem no fim.
 */
export const ModalEncomendarArma: React.FC<ModalEncomendarArmaProps> = ({ detalhe, onFechar, onFeito, avisar }) => {
  const [painel, setPainel] = useState<PainelForja | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tipoArmaId, setTipoArmaId] = useState<number | null>(null);
  const [escolhas, setEscolhas] = useState<EscolhaMaterial[]>([]);
  const [porConta, setPorConta] = useState(false);
  const [imediato, setImediato] = useState(false);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const { mesaId } = useMesa();
  const [arma, setArma] = useState<ArmaCalculada | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    forjaService
      .painel()
      .then(setPainel)
      .catch((err) => setErro(err.message || 'Não foi possível abrir a forja.'));
  }, []);

  // Moldes feitos nesta especialidade primeiro; os outros ficam disponíveis (o Mestre manda)
  const moldes = useMemo(
    () => [...(painel?.moldes ?? [])].sort((a, b) => Number(b.tipoLoja === detalhe.loja.tipo) - Number(a.tipoLoja === detalhe.loja.tipo)),
    [painel, detalhe.loja.tipo]
  );
  const tipo = painel?.tipos.find((t) => t.id === tipoArmaId);
  const molde = tipo ? painel?.moldes.find((m) => m.id === tipo.moldeId) : undefined;
  const estoque = useMemo(() => Object.fromEntries(detalhe.estoque.map((m) => [m.itemId, m.quantidade])), [detalhe.estoque]);

  const encomendar = async () => {
    if (!tipoArmaId) return;
    setEnviando(true);
    try {
      const r = await forjaService.encomendar({ lojaId: detalhe.loja.id, tipoArmaId, materiais: escolhas, insumosPorConta: porConta, imediato, mesaId, fichaId });
      const entregas = descreverEntregas(r.entregas);
      avisar('sucesso', entregas ? `Forjada e entregue: ${entregas}.` : imediato ? `${arma?.nome ?? 'A arma'} já está no estoque.` : 'Encomenda aberta na oficina. As peças ficam reservadas até a montagem.');
      onFeito(r.detalhe);
      onFechar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível abrir a encomenda.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal aberto titulo="Encomendar arma sob medida" icone={<Anvil className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={enviando} tamanho="xl">
      {erro ? (
        <p role="alert" className="flex items-start gap-2 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
        </p>
      ) : !painel ? (
        <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" aria-label="Carregando" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-5">
          <div className="space-y-4 min-w-0">
            <div>
              <label htmlFor="enc-tipo" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
                Tipo de arma
              </label>
              <select
                id="enc-tipo"
                value={tipoArmaId ?? ''}
                onChange={(e) => {
                  const novo = painel.tipos.find((t) => t.id === Number(e.target.value));
                  if (!novo || novo.moldeId !== tipo?.moldeId) setEscolhas([]);
                  setTipoArmaId(novo?.id ?? null);
                }}
                className="campo"
              >
                <option value="">Selecione…</option>
                {moldes.map((m) => (
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
            {molde && <SeletorMateriais molde={molde} materiais={painel.materiais} escolhas={escolhas} onAlterar={setEscolhas} estoque={porConta ? undefined : estoque} />}

            <CampoEncomendaPersonagem id="enc-ficha" fichaId={fichaId} onAlterar={setFichaId} dias={imediato || !arma ? 0 : Math.max(1, Math.ceil(arma.tempoHoras / 24))} />

            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer">
              <input type="checkbox" checked={porConta} onChange={(e) => setPorConta(e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
              <span className="text-xs text-texto-2">
                <strong className="font-cinzel text-pergaminho">O jogador traz os materiais</strong>
                <span className="block text-nevoa">Nada sai do estoque nem do caixa da loja. Sem esta marca, a loja usa o próprio estoque (e peças prontas que tiver).</span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer">
              <input type="checkbox" checked={imediato} onChange={(e) => setImediato(e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
              <span className="text-xs text-texto-2">
                <strong className="font-cinzel text-pergaminho">Pronta agora</strong>
                <span className="block text-nevoa">Pula os dias da forja: a arma entra no estoque na hora.</span>
              </span>
            </label>
          </div>
          <aside className="space-y-2 lg:sticky lg:top-4 self-start">
            <p className="text-[11px] font-cinzel font-bold uppercase tracking-widest text-nevoa">Como a arma sai desta oficina</p>
            <PreviaArma tipoArmaId={tipoArmaId} escolhas={escolhas} nivelLoja={detalhe.loja.nivel} onCalculada={setArma} />
          </aside>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 mt-4 border-t border-linha">
        <Button variant="ghost" size="sm" onClick={onFechar} disabled={enviando}>
          Cancelar
        </Button>
        <Button variant="gold" size="sm" icon={<Anvil className="w-3.5 h-3.5" />} loading={enviando} onClick={encomendar} disabled={!arma || arma.problemas.length > 0}>
          {imediato ? 'Forjar agora' : 'Abrir encomenda'}
        </Button>
      </div>
    </Modal>
  );
};
