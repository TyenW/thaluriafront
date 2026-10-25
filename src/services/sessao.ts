import type { ContaUsuario } from '../types/usuario';

/**
 * Conta e token da sessão atual, guardados no navegador.
 * Fica fora do authService para o api.ts ler o token sem dependência circular.
 */
const STORAGE_KEY = 'thaluria_auth_usuario';

/** Disparado quando o servidor recusa o token (expirado, revogado ou conta excluída). */
export const EVENTO_SESSAO_EXPIRADA = 'thaluria:sessao-expirada';

export function lerConta(): ContaUsuario | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const conta = data ? (JSON.parse(data) as ContaUsuario) : null;
    // Sessões salvas antes do login com token não valem mais.
    return conta?.token ? conta : null;
  } catch {
    return null;
  }
}

export function salvarConta(conta: ContaUsuario): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conta));
}

export function limparConta(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const tokenAtual = (): string | null => lerConta()?.token ?? null;

export function avisarSessaoExpirada(): void {
  limparConta();
  window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
}
