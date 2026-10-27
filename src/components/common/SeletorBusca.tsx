import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface OpcaoSeletor {
  valor: string;
  rotulo: string;
}

export interface SeletorBuscaProps {
  id?: string;
  valor: string;
  opcoes: OpcaoSeletor[];
  onAlterar: (valor: string | null) => void;
  placeholder?: string;
  /** Mostra o botão de limpar (campo opcional). */
  permitirVazio?: boolean;
  invalido?: boolean;
  /** Texto quando não há nenhuma opção cadastrada. */
  semOpcoes?: string;
}

/** A partir de quantas opções o painel ganha campo de busca. */
const MIN_PARA_BUSCAR = 8;
const ALTURA_MAX = 320;

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

interface Posicao {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

/**
 * Lista suspensa com busca, para listas longas (itens, cidades...).
 * O painel vai num portal com posição fixa: não é cortado pela rolagem de modais
 * e abre para cima quando falta espaço embaixo.
 */
export const SeletorBusca: React.FC<SeletorBuscaProps> = ({
  id,
  valor,
  opcoes,
  onAlterar,
  placeholder = 'Selecione…',
  permitirVazio = false,
  invalido = false,
  semOpcoes = 'Nenhum registro cadastrado',
}) => {
  const listaId = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');
  const [ativo, setAtivo] = useState(0);
  const [posicao, setPosicao] = useState<Posicao | null>(null);

  const selecionada = opcoes.find((o) => o.valor === valor);
  const comBusca = opcoes.length >= MIN_PARA_BUSCAR;
  const t = normalizar(termo.trim());
  const filtradas = t ? opcoes.filter((o) => normalizar(o.rotulo).includes(t)) : opcoes;

  const fechar = (devolverFoco = true) => {
    setAberto(false);
    setPosicao(null);
    setTermo('');
    if (devolverFoco) botaoRef.current?.focus();
  };

  const escolher = (o: OpcaoSeletor) => {
    onAlterar(o.valor);
    fechar();
  };

  const abrir = () => {
    if (opcoes.length === 0) return;
    setAtivo(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
    setAberto(true);
  };

  // Posição do painel: abaixo do campo, ou acima se embaixo não couber.
  useLayoutEffect(() => {
    if (!aberto) return;
    const posicionar = () => {
      const b = botaoRef.current?.getBoundingClientRect();
      if (!b) return;
      const altTela = window.visualViewport?.height ?? window.innerHeight;
      const largTela = document.documentElement.clientWidth;
      const largura = Math.min(Math.max(b.width, 240), largTela - 16);
      const left = Math.min(Math.max(8, b.left), largTela - largura - 8);
      const abaixo = altTela - b.bottom - 8;
      const acima = b.top - 8;
      if (abaixo >= Math.min(ALTURA_MAX, 240) || abaixo >= acima) {
        setPosicao({ left, width: largura, top: b.bottom + 4, maxHeight: Math.min(ALTURA_MAX, abaixo - 4) });
      } else {
        setPosicao({ left, width: largura, bottom: altTela - b.top + 4, maxHeight: Math.min(ALTURA_MAX, acima - 4) });
      }
    };
    posicionar();
    // Captura: acompanha a rolagem de qualquer contêiner (ex.: o corpo do modal).
    window.addEventListener('scroll', posicionar, true);
    window.addEventListener('resize', posicionar);
    window.visualViewport?.addEventListener('resize', posicionar);
    return () => {
      window.removeEventListener('scroll', posicionar, true);
      window.removeEventListener('resize', posicionar);
      window.visualViewport?.removeEventListener('resize', posicionar);
    };
  }, [aberto]);

  // O painel só monta depois de posicionado: é aí que o foco vai para a busca.
  const montado = aberto && posicao !== null;
  useEffect(() => {
    if (!montado) return;
    (comBusca ? buscaRef.current : listaRef.current)?.focus({ preventScroll: true });
    const clicarFora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (painelRef.current?.contains(alvo) || botaoRef.current?.contains(alvo)) return;
      setAberto(false);
      setPosicao(null);
      setTermo('');
    };
    // Esc fecha só a lista, não o modal em volta (que escuta o documento).
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setAberto(false);
      setPosicao(null);
      setTermo('');
      botaoRef.current?.focus();
    };
    document.addEventListener('pointerdown', clicarFora);
    window.addEventListener('keydown', esc, true);
    return () => {
      document.removeEventListener('pointerdown', clicarFora);
      window.removeEventListener('keydown', esc, true);
    };
  }, [montado, comBusca]);

  useEffect(() => {
    if (aberto) listaRef.current?.querySelector(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [ativo, aberto]);

  const teclar = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtradas.length === 0) return;
      setAtivo((i) => (i + (e.key === 'ArrowDown' ? 1 : filtradas.length - 1)) % filtradas.length);
    } else if (e.key === 'Home' || e.key === 'End') {
      if (e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      setAtivo(e.key === 'Home' ? 0 : filtradas.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtradas[ativo]) escolher(filtradas[ativo]);
    } else if (e.key === 'Tab') {
      fechar(false);
    }
  };

  const vazio = opcoes.length === 0;

  return (
    <div className="relative">
      <button
        ref={botaoRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? listaId : undefined}
        aria-invalid={invalido}
        disabled={vazio}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={(e) => {
          if (!aberto && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            abrir();
          }
        }}
        className={`campo flex items-center gap-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${permitirVazio && selecionada ? 'pr-16' : 'pr-9'}`}
      >
        <span className={`block truncate ${selecionada ? '' : 'text-apagado'}`}>{vazio ? semOpcoes : (selecionada?.rotulo ?? (valor ? `#${valor}` : placeholder))}</span>
      </button>
      {permitirVazio && selecionada && (
        <button
          type="button"
          onClick={() => {
            onAlterar(null);
            botaoRef.current?.focus();
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded text-nevoa hover:text-red-300 cursor-pointer"
          aria-label="Limpar seleção"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nevoa transition-transform ${aberto ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />

      {aberto &&
        posicao &&
        createPortal(
          <div
            ref={painelRef}
            onKeyDown={teclar}
            style={{ position: 'fixed', left: posicao.left, width: posicao.width, top: posicao.top, bottom: posicao.bottom, maxHeight: posicao.maxHeight }}
            className="z-[70] flex flex-col rounded-lg border border-linha-forte bg-abismo shadow-2xl shadow-black/60 overflow-hidden"
          >
            {comBusca && (
              <div className="relative p-2 border-b border-linha">
                <Search className="w-3.5 h-3.5 text-nevoa absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  ref={buscaRef}
                  type="search"
                  value={termo}
                  onChange={(e) => {
                    setTermo(e.target.value);
                    setAtivo(0);
                  }}
                  placeholder={`Buscar entre ${opcoes.length}…`}
                  aria-label="Filtrar opções"
                  aria-controls={listaId}
                  aria-activedescendant={filtradas[ativo] ? `${listaId}-${ativo}` : undefined}
                  className="campo !py-1.5 pl-8 text-sm"
                />
              </div>
            )}
            <ul ref={listaRef} id={listaId} role="listbox" tabIndex={-1} className="flex-1 overflow-y-auto overscroll-contain p-1 outline-none">
              {filtradas.length === 0 ? (
                <li className="px-3 py-6 text-center text-xs text-nevoa">Nada encontrado para “{termo}”.</li>
              ) : (
                filtradas.map((o, i) => {
                  const marcada = o.valor === valor;
                  return (
                    <li
                      key={o.valor}
                      id={`${listaId}-${i}`}
                      data-indice={i}
                      role="option"
                      aria-selected={marcada}
                      onPointerMove={() => setAtivo(i)}
                      onClick={() => escolher(o)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm cursor-pointer ${
                        i === ativo ? 'bg-ouro/15 text-pergaminho' : 'text-texto-2'
                      } ${marcada ? 'font-semibold text-amber-300' : ''}`}
                    >
                      <span className="min-w-0 break-words">{o.rotulo}</span>
                      {marcada && <Check className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
};
