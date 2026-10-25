import { requestApi } from './api';
import { lerConta, limparConta, salvarConta } from './sessao';
import type { ContaUsuario, RespostaLogin } from '../types/usuario';

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
      token: res.token,
    };

    salvarConta(conta);
    return conta;
  },

  getUsuarioSalvo(): ContaUsuario | null {
    return lerConta();
  },

  /** Invalida o token no servidor (sem esperar a resposta) e apaga a sessão local. */
  logout(): void {
    if (lerConta()) requestApi('/api/logout', { method: 'POST' }).catch(() => {});
    limparConta();
  },

  salvarUsuario(conta: ContaUsuario): void {
    salvarConta(conta);
  },
};
