import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Database, Plus, RefreshCw, Search } from 'lucide-react';
import { adminService, type EntidadeEsquema, type Registro } from '../../services/adminService';
import { ModalRegistro } from '../../components/admin/ModalRegistro';
import { TabelaRegistros } from '../../components/admin/TabelaRegistros';
import { formatarCelula, tituloDe, type Referencias } from '../../components/admin/registros';
import { Abas } from '../../components/common/Abas';
import { CabecalhoPagina } from '../../components/common/CabecalhoPagina';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ModalConfirmacao } from '../../components/common/ModalConfirmacao';
import { PainelAvisos, useAvisos } from '../../components/common/Avisos';

/** Aviso extra na confirmação de exclusão, para entidades que levam registros junto. */
const EFEITO_EXCLUSAO: Record<string, string> = {
  cidades: ' As rotas da cidade também serão removidas e personagens nela ficarão sem cidade atual.',
  monstros: ' Golpes e drops da espécie também serão removidos.',
  receitas: ' Os insumos da receita também serão removidos.',
};

export const GerenciarMundoPage: React.FC = () => {
  const [esquema, setEsquema] = useState<EntidadeEsquema[]>([]);
  const [carregandoEsquema, setCarregandoEsquema] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [refs, setRefs] = useState<Referencias>({});
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Registro | null | 'novo'>(null);
  const [paraExcluir, setParaExcluir] = useState<Registro | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { avisos, avisar, fechar } = useAvisos();

  const principais = esquema.filter((e) => !e.pai);
  const entidade = principais.find((e) => e.id === searchParams.get('entidade')) ?? principais[0];

  const carregarReferencias = useCallback(async (lista: EntidadeEsquema[]) => {
    const ids = [...new Set(lista.flatMap((e) => e.campos.map((c) => c.referencia).filter((r): r is string => !!r)))];
    const pares = await Promise.all(ids.map(async (id) => [id, await adminService.listar(id)] as const));
    setRefs(Object.fromEntries(pares));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const e = await adminService.esquema();
        setEsquema(e);
        await carregarReferencias(e);
      } catch (err: any) {
        setErro(err.message || 'Não foi possível carregar o painel. Verifique se o servidor foi atualizado.');
      } finally {
        setCarregandoEsquema(false);
      }
    })();
  }, [carregarReferencias]);

  const carregarLista = useCallback(async () => {
    if (!entidade) return;
    setCarregandoLista(true);
    try {
      setRegistros(await adminService.listar(entidade.id));
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível carregar a lista.');
    } finally {
      setCarregandoLista(false);
    }
  }, [entidade, avisar]);

  useEffect(() => {
    setBusca('');
    carregarLista();
  }, [carregarLista]);

  const aoSalvar = async () => {
    await carregarLista();
    await carregarReferencias(esquema);
  };

  const excluir = async () => {
    if (!paraExcluir || !entidade) return;
    setExcluindo(true);
    try {
      await adminService.excluir(entidade.id, paraExcluir.id);
      avisar('sucesso', 'Registro excluído.');
      setParaExcluir(null);
      await aoSalvar();
    } catch (err: any) {
      // Fecha a confirmação; o motivo da recusa (ex.: item em uso) fica no aviso.
      setParaExcluir(null);
      avisar('erro', err.message || 'Não foi possível excluir.');
    } finally {
      setExcluindo(false);
    }
  };

  const colunas = entidade?.campos.filter((c) => c.naLista) ?? [];
  const termo = busca.trim().toLowerCase();
  const filtrados = entidade
    ? registros.filter(
        (r) =>
          !termo ||
          tituloDe(entidade, r, refs).toLowerCase().includes(termo) ||
          colunas.some((c) => formatarCelula(entidade, c.coluna, r[c.coluna], esquema, refs).toLowerCase().includes(termo))
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16">
      <CabecalhoPagina
        icone={<Database />}
        titulo="Gerenciamento do Mundo"
        descricao="Crie e edite itens, receitas, monstros, cidades, rotas e lojas. Mudanças em cidades, rotas e lojas valem na hora no mapa e no motor do jogo."
      />

      {erro && (
        <Card className="p-6 border-red-500/40 bg-red-950/30 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-200">{erro}</p>
        </Card>
      )}

      {carregandoEsquema ? (
        <div className="h-64 rounded-xl bg-painel border border-linha animate-pulse" />
      ) : (
        entidade && (
          <>
            <Abas
              rotulo="Entidades"
              prefixo="entidade"
              ativa={entidade.id}
              onTrocar={(id) => setSearchParams({ entidade: id }, { replace: true })}
              abas={principais.map((e) => ({ id: e.id, rotulo: e.rotulo }))}
            />

            <Card className="p-4 sm:p-5 space-y-4" role="tabpanel" id={`entidade-painel-${entidade.id}`} aria-labelledby={`entidade-${entidade.id}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-cinzel text-base font-bold text-pergaminho flex flex-wrap items-center gap-2">
                    {entidade.rotulo} <Badge variant="gold">{registros.length}</Badge>
                    {entidade.afetaMundo && <Badge variant="cyan">Afeta o mapa</Badge>}
                  </h2>
                  {entidade.descricao && <p className="text-[11px] text-nevoa font-sans-clean mt-0.5">{entidade.descricao}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={aoSalvar} loading={carregandoLista}>
                    Atualizar
                  </Button>
                  <Button id="btn-admin-novo" variant="gold" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEditando('novo')}>
                    Novo
                  </Button>
                </div>
              </div>

              <label className="relative block">
                <span className="sr-only">Buscar</span>
                <Search className="w-4 h-4 text-nevoa absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="input-admin-busca"
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={`Buscar em ${entidade.rotulo.toLowerCase()}…`}
                  className="campo pl-9"
                />
              </label>

              {carregandoLista ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-10 bg-painel-alto rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filtrados.length === 0 ? (
                <p className="text-center text-sm text-nevoa py-10">{registros.length === 0 ? 'Nenhum registro cadastrado ainda.' : `Nada encontrado para “${busca}”.`}</p>
              ) : (
                <TabelaRegistros entidade={entidade} esquema={esquema} registros={filtrados} refs={refs} onEditar={setEditando} onExcluir={setParaExcluir} />
              )}
            </Card>
          </>
        )
      )}

      {editando && entidade && (
        <ModalRegistro
          key={editando === 'novo' ? 'novo' : String(editando.id)}
          entidade={entidade}
          esquema={esquema}
          registro={editando === 'novo' ? null : editando}
          refs={refs}
          onFechar={() => setEditando(null)}
          onSalvo={aoSalvar}
          avisar={avisar}
        />
      )}

      <ModalConfirmacao
        aberto={!!paraExcluir}
        titulo={`Excluir de ${entidade?.rotulo.toLowerCase() ?? ''}`}
        textoConfirmar="Excluir definitivamente"
        perigoso
        carregando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      >
        Excluir <strong className="text-amber-300">{paraExcluir && entidade ? tituloDe(entidade, paraExcluir, refs) : ''}</strong>?
        {entidade && EFEITO_EXCLUSAO[entidade.id]} O servidor recusa a exclusão se o registro ainda estiver em uso.
      </ModalConfirmacao>

      <PainelAvisos avisos={avisos} onFechar={fechar} />
    </div>
  );
};
