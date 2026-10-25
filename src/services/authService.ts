import { requestApi } from './api';
import type { ContaUsuario, RespostaLogin } from '../types/usuario';

const STORAGE_KEY = 'thaluria_auth_usuario';

export const authService = {
  async login(username: string, senha: string): Promise<ContaUsuario> {
    const res = await requestApi<RespostaLogin>('/api/login', {
      method: 'POST',
      body: { username, senha },
    });

    if (res.erro) {
      throw new Error(res.erro);
    }

    const conta: ContaUsuario = {
      id: res.id,
      username: res.username,
      papel: res.papel,
      limiteFichas: res.limiteFichas,
      pity: res.pity,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(conta));
    return conta;
  },

  getUsuarioSalvo(): ContaUsuario | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  salvarUsuario(conta: ContaUsuario): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conta));
  }
};
