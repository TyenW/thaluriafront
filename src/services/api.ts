/**
 * Cliente HTTP unificado para a API de Thalúria RPG.
 * - Em desenvolvimento local: usa proxy do Vite (/api -> http://localhost:8080).
 * - Em produção na Vercel: usa VITE_API_URL (ex: Cloudflare Tunnel https://thaluria-api.sua-url.com).
 */

import { avisarSessaoExpirada, tokenAtual } from './sessao';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function requestApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', params, body, timeoutMs = 12000 } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const isPostOrPut = method === 'POST' || method === 'PUT' || method === 'DELETE';
  // Em requisições POST/PUT, dados em params ou body vão no corpo HTTP (body), NUNCA na URL query string
  // Isso resolve definitivamente o erro HTTP 431 (Request Header Fields Too Large) ao enviar fotos em base64.
  const payloadBody = body || (isPostOrPut ? params : undefined);
  const queryParams = isPostOrPut ? (body ? params : undefined) : params;

  if (queryParams) {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(queryParams)) {
      if (val !== undefined && val !== null) {
        query.append(key, String(val));
      }
    }
    const qs = query.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: RequestInit = {
    method,
    signal: controller.signal,
    headers: {},
  };

  const token = tokenAtual();
  if (token) (fetchOptions.headers as Record<string, string>).Authorization = `Bearer ${token}`;

  if (isPostOrPut && payloadBody) {
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payloadBody)) {
      if (v !== undefined && v !== null) {
        form.append(k, String(v));
      }
    }
    fetchOptions.body = form.toString();
    (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
  }

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (response.status === 401 && !endpoint.includes('/api/login')) {
      avisarSessaoExpirada();
    }

    if (!response.ok) {
      const erroMsg = data?.erro || data?.message || `Erro HTTP ${response.status}`;
      throw new ApiError(erroMsg, response.status);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError('Tempo de resposta excedido. Verifique se o servidor Java está ligado.', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Falha de conexão com o servidor do jogo.', 0);
  }
}
