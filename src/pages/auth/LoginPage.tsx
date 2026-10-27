import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { KeyRound, User, AlertCircle, Wifi, Check, X } from 'lucide-react';
import { obterApiBaseUrl, definirApiBaseUrl } from '../../services/api';
import { LogoThaluria } from '../../components/layout/LogoThaluria';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarConfigUrl, setMostrarConfigUrl] = useState(false);
  const [customUrl, setCustomUrl] = useState(() => obterApiBaseUrl());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !senha) {
      setErro('Preencha o nome de usuário e a senha.');
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const conta = await login(username.trim(), senha);
      if (conta.papel === 'MESTRE') {
        navigate('/mestre');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErro(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-fundo">
      {/* Luz e brilhos mágicos de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[350px] h-[350px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brasão e Título */}
        <div className="text-center mb-8">
          <h1 className="flex justify-center">
            <LogoThaluria className="h-24 sm:h-28" />
          </h1>
          <p className="text-xs font-cinzel text-amber-500/70 tracking-[0.25em] uppercase mt-3">
            Plataforma de Exploração & Combate
          </p>
        </div>

        {/* Card de Login */}
        <Card variant="grimorio" className="p-7 sm:p-8">
          <div className="text-center mb-6 border-b border-linha-forte pb-4">
            <h2 className="text-lg font-cinzel font-bold text-pergaminho tracking-wide">
              Acesso ao Grimório
            </h2>
            <p className="text-xs text-nevoa font-sans-clean mt-1">
              Informe suas credenciais registradas no motor Java
            </p>
          </div>

          {erro && (
            <div className="mb-6 p-3.5 bg-red-950/60 border border-red-500/40 rounded-lg flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs font-sans-clean text-red-200">
                <strong className="font-cinzel text-red-300 block mb-0.5">Falha de Acesso</strong>
                {erro}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome de Usuário"
              type="text"
              placeholder="Ex: jogador1 ou mestre"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
              autoFocus
            />

            <Input
              label="Senha Secreta"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              icon={<KeyRound className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Abrir os Portões
            </Button>
          </form>
        </Card>

        {/* Rodapé com Status e Conexão Inteligente */}
        <div className="mt-6 text-center">
          {!mostrarConfigUrl ? (
            <div className="flex items-center justify-center gap-2 text-[11px] text-apagado font-sans-clean">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Conexão:{' '}
                <span className="text-amber-400/90 font-mono">
                  {obterApiBaseUrl() ? obterApiBaseUrl() : 'Local (Proxy /api)'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMostrarConfigUrl(true)}
                className="text-amber-500 hover:text-amber-300 underline underline-offset-2 ml-1 transition-colors"
                title="Alterar endereço do túnel ou servidor backend"
              >
                (Trocar)
              </button>
            </div>
          ) : (
            <div className="p-3 bg-fundo-card/90 border border-linha-media rounded-lg text-left max-w-sm mx-auto shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-cinzel text-pergaminho font-semibold flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-amber-400" /> Endereço do Servidor / Túnel
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarConfigUrl(false)}
                  className="text-nevoa hover:text-pergaminho p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Ex: https://xyz.trycloudflare.com ou vazio para local"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-fundo border border-linha-media rounded px-2.5 py-1.5 text-xs text-pergaminho focus:outline-none focus:border-amber-500 font-mono mb-2"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    definirApiBaseUrl('');
                    setCustomUrl('');
                    setMostrarConfigUrl(false);
                  }}
                  className="px-2 py-1 text-[11px] text-nevoa hover:text-pergaminho transition-colors"
                >
                  Resetar (Local)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    definirApiBaseUrl(customUrl);
                    setMostrarConfigUrl(false);
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-preto text-xs font-semibold rounded transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Salvar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
