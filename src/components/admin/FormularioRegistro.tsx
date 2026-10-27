import React from 'react';
import type { CampoEsquema, EntidadeEsquema, ValorRegistro } from '../../services/adminService';
import { rotuloEnum } from '../../utils/formatadores';
import { CampoImagem } from '../common/CampoImagem';
import { SeletorBusca } from '../common/SeletorBusca';

export interface OpcaoReferencia {
  id: string;
  titulo: string;
}

const IMAGEM_MAX_CARACTERES = 1_500_000;
/** A partir de quantas opções a lista troca o select nativo pelo seletor com busca. */
const LIMITE_LISTA_NATIVA = 8;

/** Valores iniciais de um novo registro a partir dos padrões do esquema. */
export function valoresPadrao(entidade: EntidadeEsquema): Record<string, ValorRegistro> {
  const v: Record<string, ValorRegistro> = {};
  for (const c of entidade.campos) v[c.coluna] = c.padrao ?? (c.tipo === 'BOOLEANO' ? false : null);
  return v;
}

/**
 * Campo dependente de outro: "e_rede" só aparece com o interruptor marcado;
 * "tipo=MATERIAL" só quando o campo tipo tem esse valor.
 */
export const campoVisivel = (c: CampoEsquema, valores: Record<string, ValorRegistro>) => {
  if (!c.visivelSe) return true;
  const [coluna, valor] = c.visivelSe.split('=');
  return valor === undefined ? valores[coluna] === true : String(valores[coluna] ?? '') === valor;
};

/** Mesmas regras do servidor, para avisar antes de enviar. */
export function validarCampos(entidade: EntidadeEsquema, valores: Record<string, ValorRegistro>): Record<string, string> {
  const erros: Record<string, string> = {};
  for (const c of entidade.campos) {
    if (!campoVisivel(c, valores)) continue;
    const v = valores[c.coluna];
    const vazio = v === null || v === undefined || String(v).trim() === '';
    if (vazio) {
      if (c.obrigatorio && c.tipo !== 'BOOLEANO') erros[c.coluna] = 'Obrigatório.';
      continue;
    }
    if (c.tipo === 'INTEIRO' || c.tipo === 'REAL') {
      const n = Number(String(v).replace(',', '.'));
      if (!Number.isFinite(n) || (c.tipo === 'INTEIRO' && !Number.isInteger(n))) {
        erros[c.coluna] = c.tipo === 'INTEIRO' ? 'Número inteiro.' : 'Número.';
        continue;
      }
      if (c.min != null && n < c.min) erros[c.coluna] = `Mínimo ${c.min}.`;
      if (c.max != null && n > c.max) erros[c.coluna] = `Máximo ${c.max}.`;
    }
    if (c.tipo === 'TEXTO' && String(v).length > 120) erros[c.coluna] = 'Até 120 caracteres.';
    if (c.tipo === 'TEXTO_LONGO' && String(v).length > 5000) erros[c.coluna] = 'Até 5000 caracteres.';
    if (c.tipo === 'IMAGEM') {
      const s = String(v);
      if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(s) && !/^https?:\/\/\S+$/.test(s)) erros[c.coluna] = 'Envie uma imagem ou um endereço http(s).';
      else if (s.length > IMAGEM_MAX_CARACTERES) erros[c.coluna] = 'Imagem grande demais.';
    }
  }
  return erros;
}

/** Agrupa os campos pelas seções do esquema, preservando a ordem de declaração. */
function agrupar(campos: CampoEsquema[]): { nome: string | null; campos: CampoEsquema[] }[] {
  const grupos: { nome: string | null; campos: CampoEsquema[] }[] = [];
  for (const c of campos) {
    const nome = c.grupo ?? null;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.nome === nome) ultimo.campos.push(c);
    else grupos.push({ nome, campos: [c] });
  }
  return grupos;
}

export interface FormularioRegistroProps {
  entidade: EntidadeEsquema;
  valores: Record<string, ValorRegistro>;
  onAlterar: (coluna: string, valor: ValorRegistro) => void;
  erros: Record<string, string>;
  referencias: Record<string, OpcaoReferencia[]>;
  /** Colunas que o chamador desenha por conta própria (ex.: posição no mapa). */
  ocultar?: string[];
  prefixoId: string;
}

export const FormularioRegistro: React.FC<FormularioRegistroProps> = ({ entidade, valores, onAlterar, erros, referencias, ocultar = [], prefixoId }) => {
  const campo = (c: CampoEsquema, compacto: boolean) => {
    const id = `${prefixoId}-${c.coluna}`;
    const valor = valores[c.coluna];
    const erro = erros[c.coluna];
    const rotulo = (
      <label htmlFor={id} className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
        {c.rotulo}
        {c.obrigatorio && c.tipo !== 'BOOLEANO' && <span className="text-red-300"> *</span>}
      </label>
    );
    const rodape = (
      <>
        {erro && <p className="text-[11px] text-red-300 mt-1">{erro}</p>}
        {!erro && c.ajuda && !compacto && <p className="text-[11px] text-nevoa mt-1">{c.ajuda}</p>}
      </>
    );
    const texto = valor == null ? '' : String(valor);

    switch (c.tipo) {
      case 'IMAGEM':
        return (
          <div key={c.coluna} className="sm:col-span-2">
            {rotulo}
            <CampoImagem id={id} valor={texto} onAlterar={(v) => onAlterar(c.coluna, v || null)} />
            {rodape}
          </div>
        );
      case 'BOOLEANO':
        return (
          <label key={c.coluna} htmlFor={id} className="flex items-start gap-2.5 p-3 rounded-lg border border-linha bg-abismo/50 cursor-pointer hover:border-linha-forte">
            <input id={id} type="checkbox" checked={valor === true} onChange={(e) => onAlterar(c.coluna, e.target.checked)} className="mt-0.5 accent-amber-500 w-4 h-4" />
            <span>
              <span className="text-xs font-cinzel text-pergaminho">{c.rotulo}</span>
              {c.ajuda && <span className="block text-[11px] text-nevoa">{c.ajuda}</span>}
            </span>
          </label>
        );
      case 'ENUM': {
        // Poucas opções obrigatórias: botões lado a lado, escolhidos com um toque.
        if (c.obrigatorio && c.opcoes.length <= 3) {
          return (
            <div key={c.coluna}>
              <span id={`${id}-rotulo`} className="block text-[11px] font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1">
                {c.rotulo} <span className="text-red-300">*</span>
              </span>
              <div role="radiogroup" aria-labelledby={`${id}-rotulo`} className="grid gap-1 p-1 rounded-lg border border-linha-forte bg-abismo" style={{ gridTemplateColumns: `repeat(${c.opcoes.length}, minmax(0, 1fr))` }}>
                {c.opcoes.map((o) => {
                  const marcada = texto === o;
                  return (
                    <button
                      key={o}
                      id={marcada ? id : undefined}
                      type="button"
                      role="radio"
                      aria-checked={marcada}
                      onClick={() => onAlterar(c.coluna, o)}
                      className={`px-2 py-1.5 rounded-md text-xs font-cinzel font-bold truncate transition-colors cursor-pointer ${
                        marcada ? 'bg-ouro/20 text-pergaminho shadow-[inset_0_0_0_1px_rgba(212,175,55,0.5)]' : 'text-nevoa hover:text-texto hover:bg-white/5'
                      }`}
                    >
                      {rotuloEnum(o)}
                    </button>
                  );
                })}
              </div>
              {rodape}
            </div>
          );
        }
        if (c.opcoes.length >= LIMITE_LISTA_NATIVA) {
          return (
            <div key={c.coluna}>
              {rotulo}
              <SeletorBusca
                id={id}
                valor={texto}
                opcoes={c.opcoes.map((o) => ({ valor: o, rotulo: rotuloEnum(o) }))}
                onAlterar={(v) => onAlterar(c.coluna, v)}
                permitirVazio={!c.obrigatorio}
                placeholder="—"
                invalido={!!erro}
              />
              {rodape}
            </div>
          );
        }
        return (
          <div key={c.coluna}>
            {rotulo}
            <select id={id} value={texto} onChange={(e) => onAlterar(c.coluna, e.target.value || null)} aria-invalid={!!erro} className="campo">
              {(!c.obrigatorio || valor == null) && <option value="">—</option>}
              {c.opcoes.map((o) => (
                <option key={o} value={o}>
                  {rotuloEnum(o)}
                </option>
              ))}
            </select>
            {rodape}
          </div>
        );
      }
      case 'REFERENCIA': {
        const opcoes = referencias[c.referencia ?? ''] ?? [];
        return (
          <div key={c.coluna}>
            {rotulo}
            <SeletorBusca
              id={id}
              valor={texto}
              opcoes={opcoes.map((o) => ({ valor: o.id, rotulo: o.titulo }))}
              onAlterar={(v) => onAlterar(c.coluna, v)}
              permitirVazio={!c.obrigatorio}
              invalido={!!erro}
            />
            {rodape}
          </div>
        );
      }
      case 'TEXTO_LONGO':
        return (
          <div key={c.coluna} className="sm:col-span-2">
            {rotulo}
            <textarea id={id} rows={3} value={texto} onChange={(e) => onAlterar(c.coluna, e.target.value)} aria-invalid={!!erro} className="campo" />
            {rodape}
          </div>
        );
      default:
        return (
          <div key={c.coluna}>
            {rotulo}
            <input
              id={id}
              type={c.tipo === 'TEXTO' ? 'text' : 'number'}
              inputMode={c.tipo === 'INTEIRO' ? 'numeric' : c.tipo === 'REAL' ? 'decimal' : undefined}
              step={c.tipo === 'REAL' ? 'any' : c.tipo === 'INTEIRO' ? 1 : undefined}
              min={c.min ?? undefined}
              max={c.max ?? undefined}
              value={texto}
              onChange={(e) => onAlterar(c.coluna, e.target.value)}
              aria-invalid={!!erro}
              className={`campo ${c.tipo !== 'TEXTO' ? 'font-mono' : ''} ${compacto ? 'text-center' : ''}`}
            />
            {rodape}
          </div>
        );
    }
  };

  const grupos = agrupar(entidade.campos.filter((c) => !ocultar.includes(c.coluna) && campoVisivel(c, valores)));

  return (
    <div className="space-y-5">
      {grupos.map((g, i) => {
        // Blocos de muitos números curtos (ex.: os 6 atributos) ficam numa grade compacta.
        const compacto = g.campos.length >= 4 && g.campos.every((c) => c.tipo === 'INTEIRO');
        const grade = compacto ? 'grid grid-cols-3 sm:grid-cols-6 gap-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-3';
        const corpo = <div className={grade}>{g.campos.map((c) => campo(c, compacto))}</div>;
        if (!g.nome) return <div key={`sem-grupo-${i}`}>{corpo}</div>;
        return (
          <fieldset key={g.nome} className="space-y-2.5">
            <legend className="w-full flex items-center gap-2 font-cinzel text-xs font-bold uppercase tracking-widest text-amber-300 mb-2.5">
              {g.nome}
              <span className="flex-1 h-px bg-linha" aria-hidden="true" />
            </legend>
            {corpo}
          </fieldset>
        );
      })}
    </div>
  );
};
