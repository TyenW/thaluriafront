import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Eye, MapPin, Pencil, Plus, Route, Save } from 'lucide-react';
import { adminService, ENTIDADES_COM_LIGACOES, type EntidadeEsquema, type Registro, type ValorRegistro } from '../../services/adminService';
import { distanciaKmSugerida } from '../map/tracadoRotas';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CartaoMonstro } from '../bestiario/CartaoMonstro';
import { FormularioRegistro, validarCampos, valoresPadrao } from './FormularioRegistro';
import { MapaEditor, avisosDePosicao, tracadoDaRota } from './MapaEditor';
import { SubLista } from './SubLista';
import { PainelLigacoes } from './PainelLigacoes';
import { cidadesDoEditor, monstroDoFormulario, numeroOuNulo, opcoesDe, tituloDe, type Avisar, type Referencias } from './registros';

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

  const salvar = async (criarOutro = false) => {
    setTentou(true);
    if (Object.keys(erros).length > 0) {
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
      if (criarOutro && onCriarOutro) onCriarOutro();
      // Registro novo com filhos (golpes, insumos...): continua aberto para cadastrá-los.
      else if (!idAtual && filhos.length > 0) {
        setIdAtual(novoId);
        setSalvo(JSON.stringify(valores));
      } else onFechar();
    } catch (err: any) {
      setErroServidor(err.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const formulario = (
    <div className="space-y-4 min-w-0">
      {entidade.chaveTexto && !idAtual && (
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
      )}

      <FormularioRegistro
        entidade={entidade}
        valores={valores}
        onAlterar={alterar}
        erros={tentou ? erros : {}}
        referencias={opcoes}
        ocultar={ehCidade ? ['mapa_x', 'mapa_y'] : []}
        prefixoId={`admin-${entidade.id}`}
      />

      {ehCidade && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
              <MapPin className="w-4 h-4" /> Posição no mapa
            </span>
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
      )}

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

      {erroServidor && (
        <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-100">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erroServidor}
        </p>
      )}

      {/* Rodapé fixo: salvar fica à mão mesmo no fim de formulários longos. -bottom-4 compensa o padding de quem rola (painel no celular, fundo no desktop). */}
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
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          {sujo && !confirmandoSaida && <span className="hidden sm:block mr-auto text-[11px] text-nevoa">Alterações não salvas</span>}
          <Button variant="ghost" size="sm" onClick={pedirFechar} disabled={salvando}>
            {idAtual && filhos.length > 0 && !sujo ? 'Fechar' : 'Cancelar'}
          </Button>
          {!idAtual && filhos.length === 0 && onCriarOutro && (
            <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} disabled={salvando} onClick={() => salvar(true)}>
              Salvar e criar outro
            </Button>
          )}
          <Button id="btn-admin-salvar" variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={() => salvar()}>
            {!idAtual && filhos.length > 0 ? `Salvar e cadastrar ${filhos.map((f) => f.rotulo.toLowerCase()).join(' e ')}` : 'Salvar'}
          </Button>
        </div>
      </div>

      {idAtual && filhos.map((f) => <SubLista key={f.id} entidade={f} esquema={esquema} paiId={idAtual} pai={valores} refs={refs} avisar={avisar} onMudou={() => setVersaoLigacoes((v) => v + 1)} />)}

      {idAtual && onAbrir && ENTIDADES_COM_LIGACOES.includes(entidade.id) && (
        <PainelLigacoes entidade={entidade.id} id={idAtual} versao={versaoLigacoes} onAbrir={(e, id) => sair(() => onAbrir(e, id))} />
      )}
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
