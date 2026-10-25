import React, { useMemo, useState } from 'react';
import { AlertTriangle, Eye, MapPin, Pencil, Plus, Route, Save } from 'lucide-react';
import { adminService, type EntidadeEsquema, type Registro, type ValorRegistro } from '../../services/adminService';
import { distanciaKmSugerida } from '../map/tracadoRotas';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CartaoMonstro } from '../bestiario/CartaoMonstro';
import { FormularioRegistro, validarCampos, valoresPadrao } from './FormularioRegistro';
import { MapaEditor, avisosDePosicao, tracadoDaRota } from './MapaEditor';
import { SubLista } from './SubLista';
import { cidadesDoEditor, monstroDoFormulario, numeroOuNulo, opcoesDe, tituloDe, type Avisar, type Referencias } from './registros';

export interface ModalRegistroProps {
  entidade: EntidadeEsquema;
  esquema: EntidadeEsquema[];
  registro: Registro | null;
  paiId?: string;
  refs: Referencias;
  onFechar: () => void;
  onSalvo: (id: string) => void;
  avisar: Avisar;
}

/** Editor de um registro do mundo; cidades e rotas ganham mapa, monstros ganham pré-visualização. */
export const ModalRegistro: React.FC<ModalRegistroProps> = ({ entidade, esquema, registro, paiId, refs, onFechar, onSalvo, avisar }) => {
  const [idAtual, setIdAtual] = useState<string | null>(registro ? String(registro.id) : null);
  const [valores, setValores] = useState<Record<string, ValorRegistro>>(() => (registro ? { ...registro } : valoresPadrao(entidade)));
  const [chaveTexto, setChaveTexto] = useState('');
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const ehCidade = entidade.id === 'cidades';
  const ehRota = entidade.id === 'rotas';
  const ehMonstro = entidade.id === 'monstros';
  const filhos = esquema.filter((e) => e.pai === entidade.id);
  const erros = validarCampos(entidade, valores);
  const opcoes = useMemo(() => opcoesDe(esquema, refs), [esquema, refs]);
  const alterar = (coluna: string, v: ValorRegistro) => {
    setValores((atual) => ({ ...atual, [coluna]: v }));
    setErroServidor(null);
  };

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

  const salvar = async () => {
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
      // Registro novo com filhos (golpes, insumos...): continua aberto para cadastrá-los.
      if (!idAtual && filhos.length > 0) setIdAtual(novoId);
      else onFechar();
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

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-linha">
        <Button variant="ghost" size="sm" onClick={onFechar} disabled={salvando}>
          {idAtual && filhos.length > 0 ? 'Fechar' : 'Cancelar'}
        </Button>
        <Button id="btn-admin-salvar" variant="gold" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={salvando} onClick={salvar}>
          {!idAtual && filhos.length > 0 ? `Salvar e cadastrar ${filhos.map((f) => f.rotulo.toLowerCase()).join(' e ')}` : 'Salvar'}
        </Button>
      </div>

      {idAtual && filhos.map((f) => <SubLista key={f.id} entidade={f} esquema={esquema} paiId={idAtual} refs={refs} avisar={avisar} />)}
    </div>
  );

  return (
    <Modal
      aberto
      titulo={idAtual ? `Editar: ${tituloDe(entidade, { ...valores, id: idAtual } as Registro, refs)}` : `Novo registro — ${entidade.rotulo}`}
      icone={idAtual ? <Pencil className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
      onFechar={onFechar}
      bloqueado={salvando}
      tamanho={ehMonstro ? 'xl' : 'lg'}
    >
      {ehMonstro ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-6">
          {formulario}
          <aside className="order-first lg:order-none">
            <div className="lg:sticky lg:top-4 space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-cinzel font-bold uppercase tracking-widest text-nevoa">
                <Eye className="w-3.5 h-3.5" /> Como os jogadores verão
              </p>
              <div className="max-w-xs mx-auto lg:max-w-none">
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
