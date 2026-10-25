import { useCallback, useState } from 'react';

const PREFIXO = 'thaluria:';

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = window.localStorage.getItem(PREFIXO + chave);
    return bruto === null ? padrao : (JSON.parse(bruto) as T);
  } catch {
    return padrao;
  }
}

/**
 * Preferência de interface (ex.: seção recolhida) lembrada no navegador.
 * O valor é sempre derivado da chave atual, então um componente reaproveitado
 * com outra chave não herda o estado anterior. Nunca use para dados do personagem.
 */
export function useEstadoPersistido<T>(chave: string, padrao: T): [T, (valor: T | ((anterior: T) => T)) => void] {
  const [estado, setEstado] = useState(() => ({ chave, valor: ler(chave, padrao) }));
  const valorAtual = estado.chave === chave ? estado.valor : ler(chave, padrao);

  const definir = useCallback(
    (valor: T | ((anterior: T) => T)) => {
      setEstado((anterior) => {
        const base = anterior.chave === chave ? anterior.valor : ler(chave, padrao);
        const novo = typeof valor === 'function' ? (valor as (a: T) => T)(base) : valor;
        try {
          window.localStorage.setItem(PREFIXO + chave, JSON.stringify(novo));
        } catch {
          // armazenamento indisponível (aba anônima, cota): mantém só em memória
        }
        return { chave, valor: novo };
      });
    },
    [chave, padrao]
  );

  return [valorAtual, definir];
}
