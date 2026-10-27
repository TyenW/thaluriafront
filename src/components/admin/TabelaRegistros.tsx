import React from 'react';
import { Pencil, Skull, Trash2 } from 'lucide-react';
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
}

/** Lista de registros: tabela no desktop, cartões empilhados no celular. */
export const TabelaRegistros: React.FC<TabelaRegistrosProps> = ({ entidade, esquema, registros, refs, onEditar, onExcluir, selo }) => {
  const colunas = entidade.campos.filter((c) => c.naLista);
  const imagem = colunaImagem(entidade);
  const ehRota = entidade.id === 'rotas';
  // A primeira coluna listada já é o título (nome); rotas mostram "Origem → Destino".
  const detalhes = ehRota ? colunas : colunas.slice(1);

  const acoes = (r: Registro) => (
    <>
      <button type="button" onClick={() => onEditar(r)} className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-md cursor-pointer" aria-label={`Editar ${tituloDe(entidade, r, refs)}`}>
        <Pencil className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => onExcluir(r)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer" aria-label={`Excluir ${tituloDe(entidade, r, refs)}`}>
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <>
      {/* Celular */}
      <ul className="md:hidden divide-y divide-linha">
        {registros.map((r) => (
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

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto -mx-1">
        <table className="w-full text-left text-xs font-sans-clean">
          <thead>
            <tr className="border-b border-linha text-nevoa font-cinzel uppercase text-[10px] tracking-wider">
              {imagem && <th className="py-2 px-2 w-12" aria-label="Imagem" />}
              {ehRota && <th className="py-2 px-2">Rota</th>}
              {colunas.map((c) => (
                <th key={c.coluna} className="py-2 px-2 whitespace-nowrap">
                  {c.rotulo}
                </th>
              ))}
              <th className="py-2 px-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {registros.map((r) => (
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
    </>
  );
};
