import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ImageOff, Pencil, Skull, Trash2 } from 'lucide-react';
import { corRaridade } from '../../utils/formatadores';
import type { EntidadeEsquema, Registro } from '../../services/adminService';
import { Miniatura } from '../common/Miniatura';
import { colunaImagem, formatarCelula, tituloDe, type Referencias } from './registros';

export interface TabelaRegistrosProps {
  entidade: EntidadeEsquema;
  esquema: EntidadeEsquema[];
  registros: Registro[];
  refs: Referencias;
  onEditar: (r: Registro) => void;
  onExcluir: (r: Registro) => void;
  /** Selo extra ao lado do título (ex.: "Sem origem" nos itens). */
  selo?: (r: Registro) => React.ReactNode;
  /** grade: cartões com imagem (itens, monstros). */
  visao?: 'lista' | 'grade';
}

/** Coluna virtual de ordenação pelo título (rotas: "Origem → Destino"). */
const TITULO = '__titulo';

/** Lista de registros: tabela no desktop, cartões empilhados no celular. Ordenável por coluna. */
export const TabelaRegistros: React.FC<TabelaRegistrosProps> = ({ entidade, esquema, registros, refs, onEditar, onExcluir, selo, visao = 'lista' }) => {
  const colunas = entidade.campos.filter((c) => c.naLista);
  const imagem = colunaImagem(entidade);
  const ehRota = entidade.id === 'rotas';
  // A primeira coluna listada já é o título (nome); rotas mostram "Origem → Destino".
  const detalhes = ehRota ? colunas : colunas.slice(1);

  // A ordem vale só para a entidade em que foi escolhida; sem escolha, fica a do servidor (por nome).
  const [ordemSalva, setOrdem] = useState<{ entidade: string; coluna: string; desc: boolean } | null>(null);
  const ordem = ordemSalva?.entidade === entidade.id ? ordemSalva : null;
  const ordenarPor = (coluna: string) =>
    setOrdem(ordem?.coluna === coluna ? { entidade: entidade.id, coluna, desc: !ordem.desc } : { entidade: entidade.id, coluna, desc: false });

  const texto = (r: Registro, coluna: string) => (coluna === TITULO ? tituloDe(entidade, r, refs) : formatarCelula(entidade, coluna, r[coluna], esquema, refs));
  const ordenados = !ordem
    ? registros
    : [...registros].sort((a, b) => {
        const va = ordem.coluna === TITULO ? null : a[ordem.coluna];
        const vb = ordem.coluna === TITULO ? null : b[ordem.coluna];
        const vazioA = va === null || va === '' ? 1 : 0;
        const vazioB = vb === null || vb === '' ? 1 : 0;
        // Vazios sempre no fim, em qualquer direção.
        if (ordem.coluna !== TITULO && vazioA !== vazioB) return vazioA - vazioB;
        const cmp =
          typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : typeof va === 'boolean' && typeof vb === 'boolean'
            ? Number(va) - Number(vb)
            : texto(a, ordem.coluna).localeCompare(texto(b, ordem.coluna), 'pt-BR', { numeric: true, sensitivity: 'base' });
        return ordem.desc ? -cmp : cmp;
      });

  const opcoesOrdem = [...(ehRota ? [{ coluna: TITULO, rotulo: 'Rota' }] : []), ...colunas.map((c) => ({ coluna: c.coluna, rotulo: c.rotulo }))];

  const cabecalho = (coluna: string, rotulo: string) => {
    const ativa = ordem?.coluna === coluna;
    const Icone = !ativa ? ArrowUpDown : ordem.desc ? ArrowDown : ArrowUp;
    return (
      <th key={coluna} className="py-1 px-1 whitespace-nowrap" aria-sort={ativa ? (ordem.desc ? 'descending' : 'ascending') : 'none'}>
        <button
          type="button"
          onClick={() => ordenarPor(coluna)}
          className={`inline-flex items-center gap-1 px-1 py-1 rounded uppercase tracking-wider cursor-pointer hover:text-pergaminho ${ativa ? 'text-amber-300' : ''}`}
        >
          {rotulo}
          <Icone className={`w-3 h-3 ${ativa ? '' : 'opacity-40'}`} aria-hidden="true" />
        </button>
      </th>
    );
  };

  const acoes = (r: Registro) => (
    <>
      <button
        type="button"
        onClick={() => onEditar(r)}
        className="p-2.5 md:p-2 text-amber-400 hover:bg-amber-400/10 rounded-md cursor-pointer"
        aria-label={`Editar ${tituloDe(entidade, r, refs)}`}
        title="Editar"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onExcluir(r)}
        className="p-2.5 md:p-2 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer"
        aria-label={`Excluir ${tituloDe(entidade, r, refs)}`}
        title="Excluir"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <>
      {/* Celular (e grade): ordenação fora do cabeçalho da tabela */}
      <div className={`${visao === 'grade' ? 'flex sm:max-w-sm' : 'md:hidden flex'} items-center gap-2`}>
        <label htmlFor="admin-ordenar" className="text-[11px] font-cinzel uppercase tracking-wider text-nevoa shrink-0">
          Ordenar por
        </label>
        <select
          id="admin-ordenar"
          value={ordem?.coluna ?? ''}
          onChange={(e) => setOrdem(e.target.value ? { entidade: entidade.id, coluna: e.target.value, desc: ordem?.desc ?? false } : null)}
          className="campo !py-1.5 text-xs flex-1 min-w-0"
        >
          <option value="">Padrão</option>
          {opcoesOrdem.map((o) => (
            <option key={o.coluna} value={o.coluna}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!ordem}
          onClick={() => ordem && setOrdem({ ...ordem, desc: !ordem.desc })}
          className="p-2 rounded-lg border border-linha-forte text-nevoa hover:text-amber-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label={ordem?.desc ? 'Ordem decrescente (tocar para crescente)' : 'Ordem crescente (tocar para decrescente)'}
        >
          {ordem?.desc ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
        </button>
      </div>
      {visao === 'grade' && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {ordenados.map((r) => {
            const img = imagem ? (r[imagem] as string | null) : null;
            return (
              <li key={r.id} className="relative group rounded-xl border border-linha bg-painel overflow-hidden hover:border-ouro/50 transition-colors">
                <button type="button" onClick={() => onEditar(r)} className="block w-full text-left cursor-pointer" aria-label={`Editar ${tituloDe(entidade, r, refs)}`}>
                  <span className="block aspect-[4/3] bg-abismo">
                    {img ? (
                      <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-apagado [&>svg]:w-8 [&>svg]:h-8">
                        {entidade.id === 'monstros' ? <Skull /> : <ImageOff />}
                      </span>
                    )}
                  </span>
                  <span className="block p-2.5 space-y-1">
                    <span className="block font-cinzel text-xs font-bold text-pergaminho leading-snug line-clamp-2">{tituloDe(entidade, r, refs)}</span>
                    {selo && <span className="block">{selo(r)}</span>}
                    <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-nevoa">
                      {detalhes.slice(0, 3).map((c) => (
                        <span key={c.coluna} className={c.coluna === 'raridade' ? corRaridade(String(r[c.coluna] ?? '')) : ''}>
                          {formatarCelula(entidade, c.coluna, r[c.coluna], esquema, refs)}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onExcluir(r)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-abismo/80 text-red-400 hover:bg-red-950/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer transition-opacity"
                  aria-label={`Excluir ${tituloDe(entidade, r, refs)}`}
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {visao === 'lista' && (
        <ul className="md:hidden divide-y divide-linha">
          {ordenados.map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-3">
              {imagem && <Miniatura imagem={r[imagem] as string | null} icone={entidade.id === 'monstros' ? <Skull /> : undefined} />}
              <button type="button" onClick={() => onEditar(r)} className="flex-1 min-w-0 text-left cursor-pointer">
                <span className="block font-cinzel font-bold text-sm text-pergaminho break-words">
                  {tituloDe(entidade, r, refs)} {selo?.(r)}
                </span>
                <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-nevoa">
                  {detalhes.map((c) => (
                    <span key={c.coluna}>
                      {c.rotulo}: <span className="text-texto-2">{formatarCelula(entidade, c.coluna, r[c.coluna], esquema, refs)}</span>
                    </span>
                  ))}
                </span>
              </button>
              <div className="flex shrink-0">{acoes(r)}</div>
            </li>
          ))}
        </ul>
      )}

      {/* Desktop */}
      {visao === 'lista' && (
        <div className="hidden md:block overflow-x-auto -mx-1">
          <table className="w-full text-left text-xs font-sans-clean">
            <thead>
              <tr className="border-b border-linha text-nevoa font-cinzel uppercase text-[10px] tracking-wider">
                {imagem && <th className="py-2 px-2 w-12" aria-label="Imagem" />}
                {ehRota && cabecalho(TITULO, 'Rota')}
                {colunas.map((c) => cabecalho(c.coluna, c.rotulo))}
                <th className="py-2 px-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {ordenados.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  {imagem && (
                    <td className="py-1.5 px-2">
                      <Miniatura imagem={r[imagem] as string | null} icone={entidade.id === 'monstros' ? <Skull /> : undefined} />
                    </td>
                  )}
                  {ehRota && <td className="py-2 px-2 font-cinzel font-bold text-pergaminho whitespace-nowrap">{tituloDe(entidade, r, refs)}</td>}
                  {colunas.map((c, i) => (
                    <td key={c.coluna} className={`py-2 px-2 ${i === 0 && !ehRota ? 'font-cinzel font-bold text-pergaminho' : 'text-texto-2'}`}>
                      {formatarCelula(entidade, c.coluna, r[c.coluna], esquema, refs)}
                      {i === 0 && !ehRota && selo && <span className="ml-1.5">{selo(r)}</span>}
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">{acoes(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
