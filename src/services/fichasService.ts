import { requestApi } from './api';
import type { FichaPersonagem } from '../types/ficha';

export const fichasService = {
  async listarTodas(usuarioId?: number): Promise<FichaPersonagem[]> {
    const params = usuarioId ? { usuarioId } : undefined;
    const fichas = await requestApi<FichaPersonagem[]>('/api/fichas', {
      method: 'GET',
      params,
    });
    return Array.isArray(fichas) ? fichas : [];
  },
};
