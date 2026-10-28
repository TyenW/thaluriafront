import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Eye, MapPin, Pencil, Plus, Route, Save } from 'lucide-react';
import { adminService, ENTIDADES_COM_LIGACOES, type EntidadeEsquema, type Registro, type ValorRegistro } from '../../services/adminService';
import { distanciaKmSugerida } from '../map/tracadoRotas';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CartaoMonstro } from '../bestiario/CartaoMonstro';
import { FormularioRegistro, campoVisivel, validarCampos, valoresPadrao } from './FormularioRegistro';
import { MapaEditor, avisosDePosicao, tracadoDaRota } from './MapaEditor';
import { SubLista } from './SubLista';
import { PainelLigacoes } from './PainelLigacoes';
import { cidadesDoEditor, formatarCelula, monstroDoFormulario, numeroOuNulo, opcoesDe, tituloDe, type Avisar, type Referencias } from './registros';

/** Entidades editadas em etapas (formulário longo demais para uma tela só). */
const ENTIDADES_EM_ETAPAS = ['monstros', 'cidades'];

interface Secao {
  id: string;
  titulo: string;
  tipo: 'grupo' | 'filho' | 'ligacoes';
  grupo?: string | null;
  filho?: EntidadeEsquema;
  colunas: string[];
}

export interface ModalRegistroProps {
  entidade: EntidadeEsquema;
  esquema: EntidadeEsquema[];
  registro: Registro | null;
  paiId?: string;
  /** Valores que já chegam preenchidos (ex.: item produzido ao criar receita a partir de um item). */
  valoresIniciais?: Record<string, ValorRegistro>;
  refs: Referencias;
  onFechar: () => void;
  onSalvo: (id: string) => void;
  avisar: Avisar;
  /** Abre outro registro (painel de ligações). */
  onAbrir?: (entidade: string, id: string) => void;
  /** Depois de salvar um registro novo, abre outro em branco. */
  onCriarOutro?: () => void;
}

/** Editor de um registro do mundo; cidades e rotas ganham mapa, monstros ganham pré-visualização. */
export const ModalRegistro: React.FC<ModalRegistroProps> = ({ entidade, esquema, registro, paiId, valoresIniciais, refs, onFechar, onSalvo, avisar, onAbrir, onCriarOutro }) => {
  const [idAtual, setIdAtual] = useState<string | null>(registro ? String(registro.id) : null);
  const [valores, setValores] = useState<Record<string, ValorRegistro>>(() => ({ ...(registro ? { ...registro } : valoresPadrao(entidade)), ...valoresIniciais }));
  const [chaveTexto, setChaveTexto] = useState('');
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  // Retrato do que está salvo, para avisar antes de fechar e perder alterações.
  const [salvo, setSalvo] = useState(() => JSON.stringify(valores));
  // Saída pedida com alterações pendentes (fechar ou abrir outro registro): espera confirmação.
  const [saidaPendente, setSaidaPendente] = useState<(() => void) | null>(null);
  const confirmandoSaida = saidaPendente !== null;
  const [versaoLigacoes, setVersaoLigacoes] = useState(0);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const sujo = JSON.stringify(valores) !== salvo || (!idAtual && chaveTexto.trim() !== '');

  const ehCidade = entidade.id === 'cidades';
  const ehRota = entidade.id === 'rotas';
  const ehMonstro = entidade.id === 'monstros';
  // Sublistas condicionais (ex.: locais de coleta) só aparecem com o interruptor do pai marcado.
  const filhos = esquema.filter((e) => e.pai === entidade.id && (!e.visivelSePai || valores[e.visivelSePai] === true));
  const erros = validarCampos(entidade, valores);
  const opcoes = useMemo(() => opcoesDe(esquema, refs), [esquema, refs]);
  const alterar = (coluna: string, v: ValorRegistro) => {
    setValores((atual) => ({ ...atual, [coluna]: v }));
    setErroServidor(null);
    setSaidaPendente(null);
  };

  const sair = (acao: () => void) => {
    if (sujo && !confirmandoSaida) setSaidaPendente(() => acao);
    else acao();
  };
  const pedirFechar = () => sair(onFechar);

  // Cidades: posição no mapa
  const posicao =
    ehCidade && numeroOuNulo(valores.mapa_x) != null && numeroOuNulo(valores.mapa_y) != null ? { x: Number(valores.mapa_x), y: Number(valores.mapa_y) } : null;
  const avisosCidade = ehCidade ? avisosDePosicao(posicao, valores.tem_porto === true) : [];

  // Rotas: pré-visualização do traçado
  const cidades = cidadesDoEditor(refs);
  const origem = cidades.find((c) => String(c.id) === String(valores.origem_id));
  const destino = cidades.find((c) => String(c.id) === String(valores.destino_id));
  const rotaPreview =
    ehRota && origem?.x != null && origem.y != null && destino?.x != null && destino.y != null && origem.id !== destino.id
      ? { a: { x: origem.x, y: origem.y }, b: { x: destino.x, y: destino.y }, maritima: valores.tipo_rota === 'MARITIMA' }
      : null;
  const tracado = tracadoDaRota(rotaPreview);
  const avisosRota: string[] = [];
  if (ehRota && valores.tipo_rota === 'MARITIMA' && origem && destino && (!origem.temPorto || !destino.temPorto)) {
    avisosRota.push('Rotas marítimas exigem porto nas duas cidades.');
  }
  if (tracado?.impossivel && tracado.motivo) avisosRota.push(tracado.motivo);

  // ---------------- Etapas (entidades longas, como monstros) ----------------
  // Criação: assistente que segue os grupos do esquema e depois as sublistas.
  // Edição: escolhe-se a seção a editar, sem rolar o formulário inteiro.
  const emEtapas = ENTIDADES_EM_ETAPAS.includes(entidade.id);
  const criando = !registro;
  const secoesCampos: Secao[] = [...new Set(entidade.campos.map((c) => c.grupo ?? null))].map((g) => ({
    id: `g:${g ?? ''}`,
    titulo: g ?? 'Dados',
    tipo: 'grupo',
    grupo: g,
    colunas: entidade.campos.filter((c) => (c.grupo ?? null) === g).map((c) => c.coluna),
  }));
  const secoesFilhos: Secao[] = filhos.map((f) => ({ id: `f:${f.id}`, titulo: f.rotulo, tipo: 'filho', filho: f, colunas: [] }));
  const comLigacoes = !!onAbrir && ENTIDADES_COM_LIGACOES.includes(entidade.id);
  const secoes: Secao[] = [
    ...secoesCampos,
    ...secoesFilhos,
    ...(idAtual && comLigacoes && !criando ? [{ id: 'ligacoes', titulo: 'Ligações no mundo', tipo: 'ligacoes' as const, colunas: [] }] : []),
  ];
  const [etapa, setEtapa] = useState<string | null>(() => (emEtapas && criando ? secoesCampos[0]?.id ?? null : null));
  const secaoAtual = secoes.find((x) => x.id === etapa) ?? null;
  const indice = secaoAtual ? secoes.indexOf(secaoAtual) : -1;
  const errosDe = (x: Secao) => Object.keys(erros).filter((c) => x.colunas.includes(c));
  const topoRef = useRef<HTMLDivElement>(null);
  const etapasRef = useRef<HTMLOListElement>(null);
  // A faixa de etapas rola de lado no celular: mantém a etapa atual à vista.
  useEffect(() => {
    const lista = etapasRef.current;
    const atual = lista?.querySelector<HTMLElement>('[aria-current="step"]');
    if (lista && atual) lista.scrollTo({ left: atual.offsetLeft - (lista.clientWidth - atual.offsetWidth) / 2, behavior: 'smooth' });
  }, [etapa]);
  const irPara = (id: string | null) => {
    setEtapa(id);
    setErroServidor(null);
    requestAnimationFrame(() => topoRef.current?.scrollIntoView({ block: 'start' }));
  };

  // Na tela de seções, quantos golpes/drops existem (resumo dos cartões).
  const [contagemFilhos, setContagemFilhos] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!emEtapas || etapa !== null || !idAtual) return;
    let vivo = true;
    Promise.all(filhos.map(async (f) => [f.id, (await adminService.listar(f.id, idAtual)).length] as const))
      .then((pares) => vivo && setContagemFilhos(Object.fromEntries(pares)))
      .catch(() => {});
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emEtapas, etapa, idAtual]);

  type Depois = 'padrao' | 'outro' | 'secoes' | 'proxima';
  const salvar = async (depois: Depois = 'padrao') => {
    setTentou(true);
    if (Object.keys(erros).length > 0) {
      // Em etapas, leva à primeira etapa com erro
      const comErro = emEtapas ? secoesCampos.find((x) => errosDe(x).length > 0) : null;
      if (comErro && comErro.id !== etapa) irPara(comErro.id);
      setErroServidor('Corrija os campos destacados antes de salvar.');
      return;
    }
    setSalvando(true);
    setErroServidor(null);
    try {
      const dados: Record<string, ValorRegistro | undefined> = { ...valores, id: idAtual ?? (entidade.chaveTexto ? chaveTexto.trim() || undefined : undefined) };
      if (entidade.colunaPai && paiId) dados[entidade.colunaPai] = paiId;
      const novoId = await adminService.salvar(entidade.id, dados);
      avisar('sucesso', `Registro salvo em ${entidade.rotulo}.`);
      onSalvo(novoId);
      setVersaoLigacoes((v) => v + 1);
      setSalvo(JSON.stringify(valores));
      if (depois === 'outro' && onCriarOutro) onCriarOutro();
      else if (depois === 'secoes') irPara(null);
      else if (depois === 'proxima') {
        setIdAtual(novoId);
        irPara(secoesFilhos[0]?.id ?? null);
      }
      // Registro novo com filhos (golpes, insumos...): continua aberto para cadastrá-los.
      else if (!idAtual && filhos.length > 0) setIdAtual(novoId);
      else onFechar();
    } catch (err: any) {
      setErroServidor(err.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const campoChave = entidade.chaveTexto && !idAtual && (
    <div>
      <label htmlFor="admin-chave" className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
        Identificador (opcional)
      </label>
      <input
        id="admin-chave"
        value={chaveTexto}
        onChange={(e) => setChaveTexto(e.target.value)}
        placeholder="Gerado a partir do nome se ficar vazio (ex.: LOBO_GELIDO)"
        className="campo font-mono"
      />
    </div>
  );

  const caixaErro = erroServidor && (
    <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-100">
      <AlertTriangle className="w-4 h-4 shrink-0" /> {erroServidor}
    </p>
  );

  const sublista = (f: EntidadeEsquema) => (
    <SubLista key={f.id} entidade={f} esquema={esquema} paiId={idAtual!} pai={valores} refs={refs} avisar={avisar} onMudou={() => setVersaoLigacoes((v) => v + 1)} />
  );
  const ligacoes = idAtual && comLigacoes && (
    <PainelLigacoes entidade={entidade.id} id={idAtual} versao={versaoLigacoes} onAbrir={(e, id) => sair(() => onAbrir!(e, id))} />
  );

  // Rodapé fixo: salvar fica à mão mesmo no fim de formulários longos. -bottom-4 compensa o padding de quem rola (painel no celular, fundo no desktop).
  const rodape = (botoes: React.ReactNode) => (
    <div className="sticky -bottom-4 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-painel/95 backdrop-blur border-t border-linha space-y-2">
      {confirmandoSaida && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg border border-amber-600/50 bg-amber-950/40 text-xs text-amber-100">
          <span className="flex items-center gap-1.5 flex-1">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" /> Há alterações não salvas.
          </span>
          <span className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSaidaPendente(null)}>
              Continuar editando
            </Button>
            <Button variant="outline" size="sm" className="text-red-200 border-red-700/60 hover:bg-red-950/40" onClick={() => saidaPendente?.()}>
              Descartar
            </Button>
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {sujo && !confirmandoSaida && <span className="hidden sm:block mr-auto text-[11px] text-nevoa">Alterações não salvas</span>}
        {botoes}
      </div>
    </div>
  );

  // Resumo de uma seção no cartão da tela de seções.
  const resumoDe = (x: Secao): string => {
    if (x.tipo === 'filho') {
      const n = contagemFilhos[x.filho!.id];
      return n == null ? 'Carregando…' : n === 0 ? 'Nenhum cadastrado' : `${n} cadastrado${n === 1 ? '' : 's'}`;
    }
    if (x.tipo === 'ligacoes') return 'Onde aparece no mundo';
    if (x.colunas.includes('mapa_x')) {
      const onde = posicao ? `Posicionada (${Math.round(posicao.x)}, ${Math.round(posicao.y)})` : 'Sem posição no mapa';
      return valores.tem_porto === true ? `${onde} · Possui porto` : onde;
    }
    const partes = x.colunas
      .map((c) => entidade.campos.find((k) => k.coluna === c)!)
      .filter((c) => c.tipo !== 'IMAGEM' && c.tipo !== 'TEXTO_LONGO' && valores[c.coluna] != null && valores[c.coluna] !== '')
      .slice(0, 4)
      .map((c) =>
        c.tipo === 'BOOLEANO'
          ? valores[c.coluna]
            ? c.rotulo
            : null
          : `${/^[A-Z]{2,4}$/.test(c.rotulo) ? `${c.rotulo} ` : ''}${formatarCelula(entidade, c.coluna, valores[c.coluna], esquema, refs)}`
      )
      .filter(Boolean);
    if (partes.length) return partes.join(' · ');
    // Seção só de opções (ex.: "Cidade de fronteira" desmarcada): diz isso, não "nada preenchido"
    const soOpcoes = x.colunas.every((c) => entidade.campos.find((k) => k.coluna === c)?.tipo === 'BOOLEANO' || !campoVisivel(entidade.campos.find((k) => k.coluna === c)!, valores));
    return soOpcoes ? 'Nenhuma opção marcada' : 'Nada preenchido';
  };

  // Mapa clicável para posicionar a cidade (formulário inteiro ou etapa "Posição no mapa")
  const mapaCidade = (comTitulo: boolean) => (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {comTitulo ? (
          <span className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
            <MapPin className="w-4 h-4" /> Posição no mapa
          </span>
        ) : (
          <span className="text-[11px] text-nevoa">Toque no mapa para posicionar a cidade.</span>
        )}
        <span className="text-[11px] font-mono text-nevoa">
          {posicao ? `X ${posicao.x} · Y ${posicao.y}` : 'Sem posição: toque no mapa'}
          {posicao && (
            <button type="button" className="ml-2 text-red-300 hover:text-red-200 underline cursor-pointer" onClick={() => setValores((v) => ({ ...v, mapa_x: null, mapa_y: null }))}>
              limpar
            </button>
          )}
        </span>
      </div>
      <MapaEditor cidades={cidades.filter((c) => String(c.id) !== idAtual)} marcador={posicao} onEscolher={(p) => setValores((v) => ({ ...v, mapa_x: p.x, mapa_y: p.y }))} />
      {avisosCidade.map((a) => (
        <p key={a} className="flex items-start gap-1.5 text-[11px] text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {a}
        </p>
      ))}
    </div>
  );

  const formularioEmEtapas = () => {
    // Tela de seções (edição)
    if (!secaoAtual) {
      return (
        <div ref={topoRef} className="space-y-4 min-w-0 scroll-mt-20">
          <p className="text-xs text-nevoa">O que você quer editar?</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {secoes.map((x, i) => {
              const comErro = tentou && errosDe(x).length > 0;
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => irPara(x.id)}
                    className={`w-full h-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      comErro ? 'border-red-500/60 bg-red-950/20' : 'border-linha bg-abismo/60 hover:border-ouro/50 hover:bg-amber-400/5'
                    }`}
                  >
                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full border border-linha-forte font-cinzel text-xs text-amber-300">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-cinzel text-sm font-bold text-pergaminho">{x.titulo}</span>
                      <span className="block text-[11px] text-nevoa truncate">{comErro ? 'Há campos para corrigir' : resumoDe(x)}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-nevoa" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          {caixaErro}
          {rodape(
            <>
              <Button variant="ghost" size="sm" onClick={pedirFechar} disabled={salvando}>
                {sujo ? 'Cancelar' : 'Fechar'}
              </Button>
              {sujo && (
                <Button id="btn-admin-salvar" variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={() => salvar('secoes')}>
                  Salvar alterações
                </Button>
              )}
            </>
          )}
        </div>
      );
    }

    const ultimaDeCampos = secaoAtual.tipo === 'grupo' && secoesCampos.indexOf(secaoAtual) === secoesCampos.length - 1;
    const proxima = secoes[indice + 1];
    const anterior = secoes[indice - 1];
    // Criando e ainda não salvo: só as etapas de campos; sublistas exigem o registro salvo.
    const bloqueada = (x: Secao) => x.tipo !== 'grupo' && !idAtual;
    // Depois de salvo, voltar aos campos editaria o registro já criado: o assistente segue só para a frente.
    const podeVoltar = anterior && !(idAtual && secaoAtual.tipo === 'filho' && anterior.tipo === 'grupo');

    const avancar = () => {
      if (secaoAtual.tipo === 'grupo' && errosDe(secaoAtual).length > 0) {
        setTentou(true);
        setErroServidor('Preencha os campos destacados para continuar.');
        return;
      }
      irPara(proxima!.id);
    };

    return (
      <div ref={topoRef} className="space-y-4 min-w-0 scroll-mt-20">
        {criando ? (
          <nav aria-label="Etapas" className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-[11px] font-cinzel text-nevoa">
              <span>
                Etapa {indice + 1} de {secoes.length}
              </span>
              {!idAtual && secoesFilhos.length > 0 && (
                <span className="text-apagado text-right">{secoesFilhos.map((f) => f.titulo).join(' e ')} depois de salvar</span>
              )}
            </div>
            <div className="h-1 rounded-full bg-linha overflow-hidden">
              <div className="h-full bg-ouro transition-all" style={{ width: `${((indice + 1) / secoes.length) * 100}%` }} />
            </div>
            <ol ref={etapasRef} className="abas-rolaveis relative flex gap-1.5 overflow-x-auto pb-1">
              {secoes.map((x, i) => {
                const atual = x.id === etapa;
                const comErro = tentou && errosDe(x).length > 0;
                return (
                  <li key={x.id} className="shrink-0">
                    <button
                      type="button"
                      disabled={bloqueada(x) || (!!idAtual && x.tipo === 'grupo')}
                      onClick={() => irPara(x.id)}
                      aria-current={atual ? 'step' : undefined}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-cinzel font-bold whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                        atual ? 'border-ouro/60 bg-ouro/15 text-pergaminho' : comErro ? 'border-red-500/60 text-red-200' : 'border-linha-forte text-nevoa hover:text-texto'
                      }`}
                    >
                      <span className="font-mono">{i + 1}</span> {x.titulo}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : (
          <button type="button" onClick={() => irPara(null)} className="inline-flex items-center gap-1 text-xs font-cinzel text-amber-400 hover:text-amber-300 cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Todas as seções
          </button>
        )}

        <h4 className="font-cinzel text-base font-bold text-pergaminho">{secaoAtual.titulo}</h4>

        {secaoAtual.tipo === 'grupo' && (
          <>
            {/* Etapa com posição (cidades): o mapa clicável no lugar dos campos X e Y */}
            {secaoAtual.colunas.includes('mapa_x') && mapaCidade(false)}
            <FormularioRegistro
              entidade={entidade}
              valores={valores}
              onAlterar={alterar}
              erros={tentou ? erros : {}}
              referencias={opcoes}
              grupos={[secaoAtual.grupo ?? null]}
              ocultar={secaoAtual.colunas.includes('mapa_x') ? ['mapa_x', 'mapa_y'] : []}
              prefixoId={`admin-${entidade.id}`}
            />
            {secaoAtual === secoesCampos[0] && campoChave && (
              <details className="rounded-lg border border-linha bg-abismo/50 p-3">
                <summary className="text-[11px] font-cinzel uppercase tracking-wider text-nevoa cursor-pointer">Avançado</summary>
                <div className="mt-3">{campoChave}</div>
              </details>
            )}
          </>
        )}
        {secaoAtual.tipo === 'filho' && idAtual && sublista(secaoAtual.filho!)}
        {secaoAtual.tipo === 'ligacoes' && ligacoes}

        {caixaErro}

        {rodape(
          criando ? (
            <>
              {podeVoltar ? (
                <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-3.5 h-3.5" />} onClick={() => irPara(anterior!.id)} disabled={salvando}>
                  Voltar
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={pedirFechar} disabled={salvando}>
                  {idAtual ? 'Fechar' : 'Cancelar'}
                </Button>
              )}
              {ultimaDeCampos && !idAtual ? (
                <Button
                  id="btn-admin-salvar"
                  variant="gold"
                  size="sm"
                  icon={<Save className="w-3.5 h-3.5" />}
                  loading={salvando}
                  onClick={() => salvar(secoesFilhos.length ? 'proxima' : 'padrao')}
                >
                  {secoesFilhos.length ? `Salvar e cadastrar ${secoesFilhos.map((f) => f.titulo.toLowerCase()).join(' e ')}` : 'Salvar'}
                </Button>
              ) : proxima && !bloqueada(proxima) ? (
                <Button variant="gold" size="sm" onClick={avancar} className="whitespace-nowrap" title={`Próximo: ${proxima.titulo}`}>
                  Próximo<span className="hidden sm:inline">: {proxima.titulo}</span>
                  <ChevronRight className="inline-block align-[-2px] w-3.5 h-3.5 ml-0.5" />
                </Button>
              ) : (
                idAtual && (
                  <Button variant="gold" size="sm" onClick={onFechar}>
                    Concluir
                  </Button>
                )
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-3.5 h-3.5" />} onClick={() => irPara(null)} disabled={salvando}>
                Seções
              </Button>
              {secaoAtual.tipo === 'grupo' && (
                <Button id="btn-admin-salvar" variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} disabled={!sujo} onClick={() => salvar('secoes')}>
                  {sujo ? 'Salvar' : 'Sem alterações'}
                </Button>
              )}
            </>
          )
        )}
      </div>
    );
  };

  const formulario = emEtapas ? (
    formularioEmEtapas()
  ) : (
    <div className="space-y-4 min-w-0">
      {campoChave}

      <FormularioRegistro
        entidade={entidade}
        valores={valores}
        onAlterar={alterar}
        erros={tentou ? erros : {}}
        referencias={opcoes}
        ocultar={ehCidade ? ['mapa_x', 'mapa_y'] : []}
        prefixoId={`admin-${entidade.id}`}
      />

      {ehCidade && mapaCidade(true)}

      {ehRota && (
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
            <Route className="w-4 h-4" /> Traçado no mapa
          </span>
          {rotaPreview ? (
            <MapaEditor cidades={cidades} rota={rotaPreview} destacar={[origem!.id, destino!.id]} />
          ) : (
            <p className="text-[11px] text-nevoa">Escolha duas cidades posicionadas no mapa para ver o traçado.</p>
          )}
          {tracado && !tracado.impossivel && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-texto-2">
              <span>
                Comprimento do traçado: <strong className="font-mono text-amber-300">{distanciaKmSugerida(tracado).toLocaleString('pt-BR')} km</strong>
              </span>
              <button type="button" className="text-amber-400 hover:text-amber-300 underline cursor-pointer" onClick={() => alterar('distancia_km', distanciaKmSugerida(tracado))}>
                usar como distância
              </button>
            </div>
          )}
          {avisosRota.map((a) => (
            <p key={a} className="flex items-start gap-1.5 text-[11px] text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {a}
            </p>
          ))}
        </div>
      )}

      {caixaErro}

      {rodape(
        <>
          <Button variant="ghost" size="sm" onClick={pedirFechar} disabled={salvando}>
            {idAtual && filhos.length > 0 && !sujo ? 'Fechar' : 'Cancelar'}
          </Button>
          {!idAtual && filhos.length === 0 && onCriarOutro && (
            <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} disabled={salvando} onClick={() => salvar('outro')}>
              Salvar e criar outro
            </Button>
          )}
          <Button id="btn-admin-salvar" variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={() => salvar()}>
            {!idAtual && filhos.length > 0 ? `Salvar e cadastrar ${filhos.map((f) => f.rotulo.toLowerCase()).join(' e ')}` : 'Salvar'}
          </Button>
        </>
      )}

      {idAtual && filhos.map(sublista)}

      {ligacoes}
    </div>
  );

  return (
    <Modal
      aberto
      titulo={idAtual ? `Editar: ${tituloDe(entidade, { ...valores, id: idAtual } as Registro, refs)}` : `Novo registro — ${entidade.rotulo}`}
      icone={idAtual ? <Pencil className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
      onFechar={pedirFechar}
      bloqueado={salvando}
      tamanho={ehMonstro ? 'xl' : 'lg'}
    >
      {ehMonstro ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-6">
          {formulario}
          <aside className="order-first lg:order-none">
            <div className="lg:sticky lg:top-4 space-y-2">
              {/* No celular a prévia fica recolhida para o formulário vir primeiro. */}
              <button
                type="button"
                onClick={() => setMostrarPrevia((v) => !v)}
                aria-expanded={mostrarPrevia}
                className="w-full flex items-center gap-1.5 text-[11px] font-cinzel font-bold uppercase tracking-widest text-nevoa lg:pointer-events-none cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Como os jogadores verão
                <ChevronDown className={`w-3.5 h-3.5 ml-auto lg:hidden transition-transform ${mostrarPrevia ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <div className={`max-w-xs mx-auto lg:max-w-none ${mostrarPrevia ? '' : 'hidden lg:block'}`}>
                <CartaoMonstro monstro={monstroDoFormulario(valores, idAtual)} previa />
              </div>
            </div>
          </aside>
        </div>
      ) : (
        formulario
      )}
    </Modal>
  );
};
