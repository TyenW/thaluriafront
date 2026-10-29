import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, EyeOff, Pause, Play, Plus, RefreshCw, Save, Trash2, Waypoints } from 'lucide-react';
import type { Conhecimento, EstagioConhecimento, PainelDisseminacao, ParametrosEspalhamento, PrevisaoCidade } from '../../types/conhecimento';
import { conhecimentoService, type AcaoCidade } from '../../services/conhecimentoService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CabecalhoPagina } from '../../components/common/CabecalhoPagina';
import { EstadoVazio } from '../../components/common/EstadoVazio';
import { Modal } from '../../components/common/Modal';
import { ModalConfirmacao } from '../../components/common/ModalConfirmacao';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';
import { SecaoRecolhivel } from '../../components/common/SecaoRecolhivel';
import { MapaEditor } from '../../components/admin/MapaEditor';
import { useMesa } from '../../contexts/MesaContext';

const ROTULO_ESTAGIO: Record<EstagioConhecimento, string> = { NENHUM: 'Desconhecido', RUMOR: 'Rumor', COMERCIO: 'Comércio', PRODUCAO: 'Produção' };
const COR_ESTAGIO: Record<EstagioConhecimento, string> = { NENHUM: '#8a8170', RUMOR: '#c9a227', COMERCIO: '#2f7d9b', PRODUCAO: '#2e8b57' };
const COR_REVOGADA = '#b3261e';
const VARIANTE_ESTAGIO: Record<EstagioConhecimento, 'muted' | 'gold' | 'cyan' | 'silver'> = { NENHUM: 'muted', RUMOR: 'gold', COMERCIO: 'cyan', PRODUCAO: 'silver' };

const CAMPOS_PARAMETROS: { chave: keyof ParametrosEspalhamento; rotulo: string; ajuda: string }[] = [
  { chave: 'sigiloDias', rotulo: 'Sigilo inicial (dias)', ajuda: 'Quanto a origem guarda o segredo antes de vazar.' },
  { chave: 'diasPor100Km', rotulo: 'Dias por 100 km', ajuda: 'Velocidade do boato pelas estradas e mares.' },
  { chave: 'resistenciaPorSalto', rotulo: 'Resistência por cidade (dias)', ajuda: 'Quanto cada cidade segura antes de passar adiante.' },
  { chave: 'diasRumorComercio', rotulo: 'Rumor → Comércio (dias)', ajuda: 'Até as lojas passarem a ter na prateleira.' },
  { chave: 'diasComercioProducao', rotulo: 'Comércio → Produção (dias)', ajuda: 'Até os artesãos aprenderem a fazer.' },
];

const CamposParametros: React.FC<{ valores: ParametrosEspalhamento; onMudar: (p: ParametrosEspalhamento) => void; prefixo: string }> = ({ valores, onMudar, prefixo }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
    {CAMPOS_PARAMETROS.map((c) => (
      <label key={c.chave} htmlFor={`${prefixo}-${c.chave}`} className="block" title={c.ajuda}>
        <span className="block text-[10px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">{c.rotulo}</span>
        <input
          id={`${prefixo}-${c.chave}`}
          type="number"
          min={0}
          step="any"
          value={valores[c.chave]}
          onChange={(e) => onMudar({ ...valores, [c.chave]: Math.max(0, Number(e.target.value) || 0) })}
          className="campo font-mono"
        />
      </label>
    ))}
  </div>
);

/** "dia 22 (em 5)" para o futuro, "dia 12 ✓" para o que já aconteceu. */
const DiaEstagio: React.FC<{ dia: number | null; hoje: number; pausado: boolean; alcancavel: boolean }> = ({ dia, hoje, pausado, alcancavel }) => {
  if (dia == null) return <span className="text-nevoa">{alcancavel && pausado ? 'pausado' : '—'}</span>;
  if (dia <= hoje) return <span className="text-emerald-300">dia {dia} ✓</span>;
  return (
    <span className="text-texto-2">
      dia {dia} <span className="text-nevoa">(em {dia - hoje})</span>
    </span>
  );
};

const ModalConceder: React.FC<{ painel: PainelDisseminacao; onFechar: () => void; onFeito: (id: number) => void; avisar: (t: 'sucesso' | 'erro', s: string) => void }> = ({
  painel,
  onFechar,
  onFeito,
  avisar,
}) => {
  const [tipo, setTipo] = useState<'TIPO_ARMA' | 'RECEITA'>('TIPO_ARMA');
  const [alvo, setAlvo] = useState('');
  const [origem, setOrigem] = useState('');
  const [p, setP] = useState<ParametrosEspalhamento>(painel.padrao);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const jaEspalhando = new Set(painel.conhecimentos.map((k) => `${k.tipo}:${k.tipoArmaId ?? k.receitaId}`));

  const conceder = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const r = await conhecimentoService.conceder({
        tipo,
        tipoArmaId: tipo === 'TIPO_ARMA' ? Number(alvo) : undefined,
        receitaId: tipo === 'RECEITA' ? Number(alvo) : undefined,
        cidadeOrigemId: Number(origem),
        ...p,
      });
      avisar('sucesso', 'Conhecimento concedido. Ele começa a se espalhar pelas rotas.');
      onFeito(r.id);
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Não foi possível conceder.');
    } finally {
      setEnviando(false);
    }
  };

  const opcoes = tipo === 'TIPO_ARMA' ? painel.tiposArma.map((t) => ({ id: t.id, nome: t.nome })) : painel.receitas.map((r) => ({ id: r.id, nome: `${r.nome} (${r.especialidade})` }));

  return (
    <Modal aberto titulo="Conceder conhecimento a uma cidade" icone={<Waypoints className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={enviando} tamanho="lg">
      <div className="space-y-4">
        <div className="flex gap-2" role="radiogroup" aria-label="O que se espalha">
          {(['TIPO_ARMA', 'RECEITA'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => {
                setTipo(t);
                setAlvo('');
              }}
              className={`flex-1 p-2.5 rounded-lg border text-xs text-left cursor-pointer ${tipo === t ? 'border-ouro/60 bg-amber-400/10 text-pergaminho' : 'border-linha text-nevoa hover:border-linha-forte'}`}
            >
              <strong className="block font-cinzel text-sm">{t === 'TIPO_ARMA' ? 'Tipo de arma' : 'Receita pronta'}</strong>
              {t === 'TIPO_ARMA' ? 'Saber fazer Katanas: todas as receitas e encomendas do tipo.' : 'Uma receita específica: arma, remédio, cosmético, armadura...'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">{tipo === 'TIPO_ARMA' ? 'Tipo de arma' : 'Receita'}</span>
            <select value={alvo} onChange={(e) => setAlvo(e.target.value)} className="campo">
              <option value="">Selecione…</option>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id} disabled={jaEspalhando.has(`${tipo}:${o.id}`)}>
                  {o.nome}
                  {jaEspalhando.has(`${tipo}:${o.id}`) ? ' (já se espalhando)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">Cidade que adquiriu</span>
            <select value={origem} onChange={(e) => setOrigem(e.target.value)} className="campo">
              <option value="">Selecione…</option>
              {[...painel.cidades]
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <CamposParametros valores={p} onMudar={setP} prefixo="conceder" />
        <p className="text-[11px] text-nevoa">
          A origem já produz hoje. As outras cidades ouvem o rumor depois do sigilo, mais o tempo de cada trecho pelo caminho mais curto e a resistência de cada cidade no
          meio. Rotas bloqueadas não levam o segredo.
        </p>
        {erro && (
          <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-100">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="gold" size="sm" icon={<Waypoints className="w-3.5 h-3.5" />} loading={enviando} onClick={conceder} disabled={!alvo || !origem}>
            Conceder
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/** Disseminação: quem sabe fazer o quê, quando cada cidade vai saber, e os controles do Mestre. Só o Mestre vê. */
export const DisseminacaoPage: React.FC = () => {
  const [painel, setPainel] = useState<PainelDisseminacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [concedendo, setConcedendo] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [parametros, setParametros] = useState<ParametrosEspalhamento | null>(null);
  const [cidadeFoco, setCidadeFoco] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { avisos, avisar, fechar } = useAvisos();
  const { mesa, mesaId, painel: painelMesas, erro: erroMesas } = useMesa();
  const mesasProntas = painelMesas != null || erroMesas != null;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setPainel(await conhecimentoService.painel(mesaId));
      setErro(null);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível carregar. Reinicie o servidor para aplicar a atualização.');
    } finally {
      setCarregando(false);
    }
  }, [mesaId]);

  // Espera as mesas para já pedir pelo dia da mesa escolhida
  useEffect(() => {
    if (mesasProntas) carregar();
  }, [carregar, mesasProntas]);

  const selecionadoId = Number(searchParams.get('k')) || painel?.conhecimentos[0]?.id || null;
  const k = painel?.conhecimentos.find((x) => x.id === selecionadoId) ?? null;
  const nomeCidade = useMemo(() => Object.fromEntries((painel?.cidades ?? []).map((c) => [c.id, c.nome])), [painel]);

  useEffect(() => {
    setParametros(k ? { sigiloDias: k.sigiloDias, diasPor100Km: k.diasPor100Km, resistenciaPorSalto: k.resistenciaPorSalto, diasRumorComercio: k.diasRumorComercio, diasComercioProducao: k.diasComercioProducao } : null);
  }, [k]);

  const agir = async (fn: () => Promise<unknown>, sucesso: string) => {
    try {
      await fn();
      avisar('sucesso', sucesso);
      await carregar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível concluir.');
    }
  };

  const linhas = useMemo(() => {
    if (!k) return [];
    const ordem = (p: PrevisaoCidade) => (p.origem ? -1 : p.diaRumor ?? Number.MAX_SAFE_INTEGER);
    return [...k.cidades].sort((a, b) => ordem(a) - ordem(b) || (nomeCidade[a.cidadeId] ?? '').localeCompare(nomeCidade[b.cidadeId] ?? ''));
  }, [k, nomeCidade]);

  const cores = useMemo(() => Object.fromEntries((k?.cidades ?? []).map((p) => [p.cidadeId, p.revogada ? COR_REVOGADA : COR_ESTAGIO[p.estagio]])), [k]);

  const acaoCidade = (p: PrevisaoCidade, acao: AcaoCidade) => {
    if (!k) return;
    const nome = nomeCidade[p.cidadeId];
    const texto: Record<AcaoCidade, string> = {
      RUMOR: `${nome} agora ouviu o rumor.`,
      COMERCIO: `${nome} agora comercializa.`,
      PRODUCAO: `${nome} agora sabe fazer.`,
      REVOGAR: `${nome} esqueceu o conhecimento e não passa adiante.`,
      LIMPAR: `${nome} voltou ao cálculo normal.`,
    };
    agir(() => conhecimentoService.cidade(k.id, p.cidadeId, acao), texto[acao]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16">
      <CabecalhoPagina
        icone={<Waypoints />}
        titulo="Disseminação"
        descricao="Quando uma cidade adquire um saber novo, as outras levam tempo para ouvir falar, comercializar e aprender a fazer. Só o Mestre vê esta tela."
        acoes={
          <>
            {painel && (
              <span
                className="text-xs font-cinzel text-nevoa"
                title="Os estágios são os do dia da mesa escolhida. Conceder, pausar e adiantar valem no dia da campanha (a mesa ativa mais à frente)."
              >
                Dia {painel.dia}
                {mesa ? ` · mesa ${mesa.nome}` : ''}
              </span>
            )}
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={carregar} loading={carregando}>
              Atualizar
            </Button>
            <Button variant="gold" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setConcedendo(true)} disabled={!painel}>
              Conceder conhecimento
            </Button>
          </>
        }
      />

      <SecaoRecolhivel chave="disseminacao-guia" titulo="Como o conhecimento se espalha" abertaPorPadrao>
        <ul className="space-y-1 text-[11px] text-texto-2 leading-relaxed">
          <li>
            <Badge variant="gold">Rumor</Badge> a cidade sabe que existe: as lojas podem encomendar de quem já produz. Antes disso, nenhuma caravana leva o item até lá.
          </li>
          <li>
            <Badge variant="cyan">Comércio</Badge> as lojas da especialidade e as Lojas Gerais passam a procurar o item e mantê-lo na prateleira.
          </li>
          <li>
            <Badge variant="silver">Produção</Badge> os artesãos aprendem: a IA fabrica as receitas, e o ferreiro aceita encomendas sob medida do tipo.
          </li>
          <li>Receitas e tipos de arma que nunca foram concedidos continuam comuns: valem no mundo todo, como sempre.</li>
        </ul>
      </SecaoRecolhivel>

      {erro && (
        <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro}
        </p>
      )}

      {painel && painel.conhecimentos.length === 0 && (
        <EstadoVazio icone={<Waypoints />} titulo="Nenhum conhecimento se espalhando">
          Use “Conceder conhecimento” quando uma cidade adquirir uma arma ou receita nova.
        </EstadoVazio>
      )}

      {painel && painel.conhecimentos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)] gap-5">
          <ul className="space-y-2" aria-label="Conhecimentos">
            {painel.conhecimentos.map((c: Conhecimento) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSearchParams({ k: String(c.id) }, { replace: true })}
                  aria-current={c.id === k?.id}
                  className={`w-full text-left p-3 rounded-xl border cursor-pointer ${c.id === k?.id ? 'border-ouro/60 bg-amber-400/10' : 'border-linha bg-painel hover:border-linha-forte'}`}
                >
                  <span className="block font-cinzel text-sm font-bold text-pergaminho">{c.nome}</span>
                  <span className="block text-[11px] text-nevoa">
                    {c.tipo === 'TIPO_ARMA' ? 'Tipo de arma' : 'Receita'} · de {nomeCidade[c.cidadeOrigemId] ?? '?'}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {(['RUMOR', 'COMERCIO', 'PRODUCAO'] as EstagioConhecimento[]).map((e) => (
                      <Badge key={e} variant={VARIANTE_ESTAGIO[e]}>
                        {c.contagem[e]} {ROTULO_ESTAGIO[e]}
                      </Badge>
                    ))}
                    {c.pausado && <Badge variant="danger">Pausado</Badge>}
                    {c.segredo && <Badge variant="purple">Segredo</Badge>}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {k && (
            <section className="space-y-4 min-w-0">
              <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-pergaminho">{k.nome}</h2>
                  <p className="text-xs text-nevoa">
                    Adquirido por {nomeCidade[k.cidadeOrigemId]} no dia {k.diaConcessao} · {Math.max(0, Math.floor(k.decorrido))} dia(s) de espalhamento
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={k.pausado ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    onClick={() => agir(() => conhecimentoService.pausar(k.id, !k.pausado), k.pausado ? 'Espalhamento retomado.' : 'Espalhamento pausado: o relógio parou.')}
                  >
                    {k.pausado ? 'Retomar' : 'Pausar'}
                  </Button>
                  <Button
                    variant={k.segredo ? 'gold' : 'outline'}
                    size="sm"
                    icon={<EyeOff className="w-3.5 h-3.5" />}
                    onClick={() => agir(() => conhecimentoService.segredo(k.id, !k.segredo), k.segredo ? 'Não é mais segredo: volta a se espalhar.' : 'Agora é segredo: não sai de quem já sabe.')}
                    aria-pressed={k.segredo}
                  >
                    Segredo
                  </Button>
                  <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setExcluindo(true)}>
                    Excluir
                  </Button>
                </div>
              </header>

              {parametros && (
                <div className="p-3 rounded-xl border border-linha bg-painel space-y-2.5">
                  <CamposParametros valores={parametros} onMudar={setParametros} prefixo="editar" />
                  <Button variant="outline" size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={() => agir(() => conhecimentoService.parametros(k.id, parametros), 'Tempos atualizados; as previsões foram recalculadas.')}>
                    Salvar tempos
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <MapaEditor
                  cidades={painel.cidades.map((c) => ({ id: c.id, nome: c.nome, x: c.x, y: c.y }))}
                  cores={cores}
                  destacar={[k.cidadeOrigemId, ...(cidadeFoco ? [cidadeFoco] : [])]}
                  onEscolherCidade={(id) => setCidadeFoco(Number(id))}
                  altura={380}
                />
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-nevoa">
                  {(Object.keys(COR_ESTAGIO) as EstagioConhecimento[]).map((e) => (
                    <span key={e} className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COR_ESTAGIO[e] }} /> {ROTULO_ESTAGIO[e]}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COR_REVOGADA }} /> Revogada
                  </span>
                  <span>· ponto grande = origem (e a cidade que você tocou)</span>
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-linha">
                <table className="w-full text-left text-xs font-sans-clean">
                  <thead className="bg-painel">
                    <tr className="border-b border-linha text-nevoa font-cinzel uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-2.5">Cidade</th>
                      <th className="py-2 px-2.5">Agora</th>
                      <th className="py-2 px-2.5">Rumor</th>
                      <th className="py-2 px-2.5">Comércio</th>
                      <th className="py-2 px-2.5">Produção</th>
                      <th className="py-2 px-2.5">Caminho</th>
                      <th className="py-2 px-2.5">Intervir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linha">
                    {linhas.map((p) => (
                      <tr key={p.cidadeId} className={p.cidadeId === cidadeFoco ? 'bg-amber-400/10' : 'hover:bg-white/5'}>
                        <td className="py-1.5 px-2.5 font-cinzel text-pergaminho whitespace-nowrap">
                          {nomeCidade[p.cidadeId]}
                          {p.origem && <Badge variant="gold" className="ml-1.5">Origem</Badge>}
                          {p.adiantadoPara && <Badge variant="purple" className="ml-1.5">Adiantada</Badge>}
                        </td>
                        <td className="py-1.5 px-2.5">
                          {p.revogada ? <Badge variant="danger">Revogada</Badge> : <Badge variant={VARIANTE_ESTAGIO[p.estagio]}>{ROTULO_ESTAGIO[p.estagio]}</Badge>}
                        </td>
                        {(['diaRumor', 'diaComercio', 'diaProducao'] as const).map((campo) => (
                          <td key={campo} className="py-1.5 px-2.5 whitespace-nowrap font-mono">
                            <DiaEstagio dia={p[campo]} hoje={painel.dia} pausado={k.pausado} alcancavel={p.alcancavel} />
                          </td>
                        ))}
                        <td className="py-1.5 px-2.5 text-nevoa whitespace-nowrap">
                          {p.origem ? '—' : p.alcancavel ? `${p.saltos} salto(s) · ${p.km.toLocaleString('pt-BR')} km` : 'sem caminho'}
                        </td>
                        <td className="py-1.5 px-2.5">
                          <select
                            aria-label={`Intervir em ${nomeCidade[p.cidadeId]}`}
                            value=""
                            onChange={(e) => e.target.value && acaoCidade(p, e.target.value as AcaoCidade)}
                            className="campo !py-1 text-xs min-w-32"
                          >
                            <option value="">Escolher…</option>
                            <option value="RUMOR">Adiantar: Rumor agora</option>
                            <option value="COMERCIO">Adiantar: Comércio agora</option>
                            <option value="PRODUCAO">Adiantar: Produção agora</option>
                            <option value="REVOGAR">Revogar (esquece)</option>
                            {(p.revogada || p.adiantadoPara) && <option value="LIMPAR">Voltar ao normal</option>}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {painel && concedendo && (
        <ModalConceder painel={painel} onFechar={() => setConcedendo(false)} onFeito={(id) => carregar().then(() => setSearchParams({ k: String(id) }, { replace: true }))} avisar={avisar} />
      )}
      <ModalConfirmacao
        aberto={excluindo}
        titulo="Excluir conhecimento"
        textoConfirmar="Excluir"
        perigoso
        onConfirmar={() => {
          setExcluindo(false);
          if (k) agir(() => conhecimentoService.excluir(k.id), `${k.nome} voltou a ser comum: vale no mundo todo.`).then(() => setSearchParams({}, { replace: true }));
        }}
        onCancelar={() => setExcluindo(false)}
      >
        Excluir <strong className="text-amber-300">{k?.nome}</strong>? Sem o conhecimento, ele volta a ser comum: toda loja da especialidade, em qualquer cidade, passa a saber
        fazer.
      </ModalConfirmacao>
      <PainelAvisos avisos={avisos} onFechar={fechar} />
    </div>
  );
};
