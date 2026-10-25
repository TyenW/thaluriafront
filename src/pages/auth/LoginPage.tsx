import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Sparkles, KeyRound, User, AlertCircle, Shield, Crown, HelpCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  const preencherCredencial = (user: string, pass: string) => {
    setUsername(user);
    setSenha(pass);
    setErro(null);
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-950 p-[1.5px] mx-auto mb-4 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <div className="w-full h-full bg-painel rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-decorative font-bold gold-gradient-text tracking-wider leading-tight">
            Thalúria RPG
          </h1>
          <p className="text-xs font-cinzel text-amber-500/70 tracking-[0.25em] uppercase mt-1">
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

          {/* Atalhos Rápidos para Contas Padrão */}
          <div className="mt-7 pt-5 border-t border-linha">
            <p className="text-[11px] font-cinzel text-nevoa uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Contas Rápidas do Sistema</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => preencherCredencial('jogador1', '123456')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-painel hover:bg-linha border border-linha-forte hover:border-amber-600/50 rounded text-xs text-texto font-cinzel transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Jogador 1</span>
              </button>

              <button
                type="button"
                onClick={() => preencherCredencial('mestre', 'thaluriaadmin')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1f191b] hover:bg-[#2a1f22] border border-red-900/40 hover:border-red-500/50 rounded text-xs text-red-200 font-cinzel transition-all cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Mestre</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Nota de rodapé técnica */}
        <p className="text-center text-[11px] text-apagado font-sans-clean mt-6">
          Conexão direta com <span className="text-amber-500/70 font-mono">ServidorThaluriaAPI</span> (Porta 8080 ou Cloudflare Tunnel)
        </p>

      </div>
    </div>
  );
};
