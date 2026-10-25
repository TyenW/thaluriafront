import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Loader2, Crown } from 'lucide-react';

export const MasterLayout: React.FC = () => {
  const { usuario, loading, isMestre } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a0f]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="font-cinzel text-sm text-amber-200/80 tracking-widest uppercase">
            Autenticando Permissões do Mestre...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!isMestre) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f]">
      <div className="bg-gradient-to-r from-red-950/60 via-amber-950/40 to-red-950/60 border-b border-amber-600/30 px-4 py-1 text-center text-xs font-cinzel text-amber-300/90 flex items-center justify-center gap-2">
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span>MODO MESTRE ATIVO — ACESSO TOTAL AO FOG-OF-WAR, BANCO SQLITE E SESSÕES AO VIVO</span>
      </div>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="py-6 border-t border-[#1f2430] bg-[#07080b]/80 text-center text-xs text-[#6b7280] font-sans-clean">
        <p className="font-cinzel tracking-wider text-amber-500/60 mb-1">
          PAINEL ADMINISTRATIVO DO MESTRE • THALÚRIA RPG
        </p>
        <p>Operações refletidas diretamente em thaluria.db via Virtual Threads.</p>
      </footer>
    </div>
  );
};
