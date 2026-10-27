import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Anvil, Layers, Pencil, Plus, RefreshCw, Sword, Swords, Trash2 } from 'lucide-react';
import type { MoldeArma, PainelForja, ReceitaArma, TipoArma } from '../../types/forja';
import { forjaService } from '../../services/forjaService';
import { corRaridade, formatarLatao, rotuloEnum, rotuloTipoLoja } from '../../utils/formatadores';
import { Abas } from '../../components/common/Abas';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CabecalhoPagina } from '../../components/common/CabecalhoPagina';
import { EstadoVazio } from '../../components/common/EstadoVazio';
import { ModalConfirmacao } from '../../components/common/ModalConfirmacao';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';
import { SecaoRecolhivel } from '../../components/common/SecaoRecolhivel';
import { EditorReceitaArma } from '../../components/forja/EditorReceitaArma';
import { EditorTipoArma } from '../../components/forja/EditorTipoArma';
import { EditorMolde } from '../../components/forja/EditorMolde';
import { ROTULO_CATEGORIA, rotuloOpcao } from '../../components/forja/SeletorMateriais';

type AbaForja = 'receitas' | 'tipos' | 'moldes';
type Editando = { aba: 'receitas'; r: ReceitaArma | null } | { aba: 'tipos'; t: TipoArma | null } | { aba: 'moldes'; m: MoldeArma | null };
type Excluindo = { aba: AbaForja; id: number; nome: string };

const acoesItem = (onEditar: () => void, onExcluir: () => void, nome: string) => (
  <span className="flex shrink-0">
    <button type="button" onClick={onEditar} className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-md cursor-pointer" aria-label={`Editar ${nome}`}>
      <Pencil className="w-4 h-4" />
    </button>
    <button type="button" onClick={onExcluir} className="p-2 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer" aria-label={`Excluir ${nome}`}>
      <Trash2 className="w-4 h-4" />
    </button>
  </span>
);

/** Forja do Mestre: moldes de arma (partes), tipos de arma (dado base) e receitas prontas (material de cada parte). */
export const ForjaPage: React.FC = () => {
  const [painel, setPainel] = useState<PainelForja | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<Editando | null>(null);
  const [excluindo, setExcluindo] = useState<Excluindo | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { avisos, avisar, fechar } = useAvisos();
  const aba = (['receitas', 'tipos', 'moldes'] as AbaForja[]).find((a) => a === searchParams.get('aba')) ?? 'receitas';

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setPainel(await forjaService.painel());
      setErro(null);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível abrir a forja. Reinicie o servidor para aplicar a atualização.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const excluir = async () => {
    if (!excluindo) return;
    try {
      if (excluindo.aba === 'receitas') await forjaService.excluirReceita(excluindo.id);
      if (excluindo.aba === 'tipos') await forjaService.excluirTipo(excluindo.id);
      if (excluindo.aba === 'moldes') await forjaService.excluirMolde(excluindo.id);
      avisar('sucesso', `"${excluindo.nome}" excluído.`);
      await carregar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível excluir.');
    } finally {
      setExcluindo(null);
    }
  };

  const tipoDe = (id: number) => painel?.tipos.find((t) => t.id === id);
  const moldeDe = (id: number) => painel?.moldes.find((m) => m.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16">
      <CabecalhoPagina
        icone={<Anvil />}
        titulo="Forja"
        descricao="Armas montadas por partes: cada parte é forjada de materiais, e os materiais decidem dano, peso, valor e raridade."
        acoes={
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={carregar} loading={carregando}>
            Atualizar
          </Button>
        }
      />

      <SecaoRecolhivel chave="forja-guia" titulo="Como a forja funciona" abertaPorPadrao>
        <ol className="list-decimal pl-5 space-y-1 text-[11px] text-texto-2 leading-relaxed">
          <li>
            <strong className="text-pergaminho">Materiais</strong>: em{' '}
            <Link to="/mestre/gerenciar?entidade=itens" className="text-amber-400 underline">
              Gerenciar → Itens
            </Link>
            , dê a cada material uma categoria (Metal, Madeira, Couro...), bônus de dano e durabilidade.
          </li>
          <li>
            <strong className="text-pergaminho">Moldes</strong>: cada família de arma tem partes (a espada: lâmina, guarda, cabo e pomo). Cada parte diz quantos materiais
            consome e o que aceita.
          </li>
          <li>
            <strong className="text-pergaminho">Tipos</strong>: Katana, Arco Longo... dão o dado base e usam as partes de um molde.
          </li>
          <li>
            <strong className="text-pergaminho">Receitas</strong>: escolha um material por parte. Dois metais numa parte viram liga. Ao salvar, as peças e a arma entram no
            catálogo e as forjas passam a fabricá-la sozinhas.
          </li>
          <li>
            Na loja, <strong className="text-pergaminho">Produção → Encomendar arma</strong> faz uma arma sob medida para um jogador.
          </li>
        </ol>
      </SecaoRecolhivel>

      {erro && (
        <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
        </p>
      )}

      {painel && (
        <>
          <Abas
            rotulo="Forja"
            prefixo="forja"
            ativa={aba}
            onTrocar={(id) => setSearchParams({ aba: id }, { replace: true })}
            abas={[
              { id: 'receitas', rotulo: 'Receitas de arma', icone: <Sword className="w-4 h-4" />, contagem: painel.receitas.length },
              { id: 'tipos', rotulo: 'Tipos de arma', icone: <Swords className="w-4 h-4" />, contagem: painel.tipos.length },
              { id: 'moldes', rotulo: 'Moldes', icone: <Layers className="w-4 h-4" />, contagem: painel.moldes.length },
            ]}
          />

          <div role="tabpanel" id={`forja-painel-${aba}`} aria-labelledby={`forja-${aba}`} className="space-y-3">
            {aba === 'receitas' && (
              <>
                <Button variant="gold" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEditando({ aba: 'receitas', r: null })}>
                  Nova receita de arma
                </Button>
                {painel.receitas.length === 0 ? (
                  <EstadoVazio icone={<Sword />} titulo="Nenhuma receita de arma">
                    Crie a primeira escolhendo o tipo e o material de cada parte.
                  </EstadoVazio>
                ) : (
                  <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {painel.receitas.map((r) => (
                      <li key={r.id} className="p-3 rounded-xl bg-painel border border-linha flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-cinzel text-sm font-bold text-pergaminho break-words">{r.nome}</h3>
                            <span className="text-[11px] text-nevoa">{tipoDe(r.tipoArmaId)?.nome ?? 'Tipo apagado'}</span>
                          </div>
                          {acoesItem(() => setEditando({ aba: 'receitas', r }), () => setExcluindo({ aba: 'receitas', id: r.id, nome: r.nome }), r.nome)}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                          <span className="font-mono text-amber-300">{r.arma.dano}</span>
                          <span className="text-texto-2">{r.arma.durabilidade} dur.</span>
                          <span className="text-texto-2">{r.arma.pesoKg?.toLocaleString('pt-BR')} kg</span>
                          <span className="text-texto-2">{formatarLatao(r.arma.precoLatao ?? 0)}</span>
                          <span className={corRaridade(r.arma.raridade)}>{rotuloEnum(r.arma.raridade ?? '')}</span>
                        </div>
                        <p className="text-[11px] text-nevoa">{r.arma.componentes?.map((c) => c.nome).join(' · ')}</p>
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {r.somenteEncomenda && <Badge variant="muted">Só por encomenda</Badge>}
                          {r.arma.problemas.length > 0 && (
                            <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>
                              {r.arma.problemas.length} problema(s): edite
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {aba === 'tipos' && (
              <>
                <Button variant="gold" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEditando({ aba: 'tipos', t: null })} disabled={painel.moldes.length === 0}>
                  Novo tipo de arma
                </Button>
                {painel.moldes.map((m) => {
                  const tipos = painel.tipos.filter((t) => t.moldeId === m.id);
                  if (tipos.length === 0) return null;
                  return (
                    <section key={m.id} className="space-y-1.5">
                      <h3 className="font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300">{m.nome}</h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {tipos.map((t) => (
                          <li key={t.id} className="flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-lg bg-painel border border-linha">
                            <span className="flex-1 min-w-0">
                              <span className="block font-cinzel text-sm text-pergaminho truncate">{t.nome}</span>
                              <span className="text-[11px] text-nevoa">
                                {t.qtdDados}d{t.facesDado}
                                {t.alcanceM > 0 && ` · ${t.alcanceM} m`}
                              </span>
                            </span>
                            {acoesItem(() => setEditando({ aba: 'tipos', t }), () => setExcluindo({ aba: 'tipos', id: t.id, nome: t.nome }), t.nome)}
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </>
            )}

            {aba === 'moldes' && (
              <>
                <Button variant="gold" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEditando({ aba: 'moldes', m: null })}>
                  Novo molde
                </Button>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {painel.moldes.map((m) => (
                    <li key={m.id} className="p-3 rounded-xl bg-painel border border-linha space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-cinzel text-base font-bold text-pergaminho">{m.nome}</h3>
                          <span className="text-[11px] text-nevoa">
                            {rotuloTipoLoja(m.tipoLoja)} · {m.slotsEfeito} slot(s) de efeito · montagem {m.tempoMontagemHoras} h ·{' '}
                            {painel.tipos.filter((t) => t.moldeId === m.id).length} tipo(s)
                          </span>
                        </div>
                        {acoesItem(() => setEditando({ aba: 'moldes', m }), () => setExcluindo({ aba: 'moldes', id: m.id, nome: m.nome }), m.nome)}
                      </div>
                      <ul className="space-y-0.5 text-xs">
                        {m.partes.map((p) => (
                          <li key={p.id} className="text-texto-2">
                            <strong className="text-pergaminho">{p.nome}</strong> ×{p.qtdMateriais} · {p.tempoHoras} h ·{' '}
                            <span className="text-nevoa">{p.opcoes.map((o) => (o.itemId != null ? rotuloOpcao(o) : ROTULO_CATEGORIA[o.categoria ?? ''])).join(', ')}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      {painel && editando?.aba === 'receitas' && <EditorReceitaArma painel={painel} receita={editando.r} onFechar={() => setEditando(null)} onSalvo={carregar} avisar={avisar} />}
      {painel && editando?.aba === 'tipos' && <EditorTipoArma moldes={painel.moldes} tipo={editando.t} onFechar={() => setEditando(null)} onSalvo={carregar} avisar={avisar} />}
      {painel && editando?.aba === 'moldes' && <EditorMolde molde={editando.m} categorias={painel.categorias} onFechar={() => setEditando(null)} onSalvo={carregar} avisar={avisar} />}

      <ModalConfirmacao
        aberto={!!excluindo}
        titulo="Excluir da forja"
        textoConfirmar="Excluir"
        perigoso
        onConfirmar={excluir}
        onCancelar={() => setExcluindo(null)}
      >
        Excluir <strong className="text-amber-300">{excluindo?.nome}</strong>? O servidor recusa se ainda estiver em uso
        {excluindo?.aba === 'moldes' && moldeDe(excluindo.id) ? ' (tipos de arma usando o molde)' : ''}.
      </ModalConfirmacao>

      <PainelAvisos avisos={avisos} onFechar={fechar} />
    </div>
  );
};
