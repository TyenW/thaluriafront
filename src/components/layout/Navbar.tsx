import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Shield, 
  Map as MapIcon, 
  BookOpen, 
  Package, 
  Sparkles, 
  Box, 
  Crown, 
  LogOut, 
  Users, 
  Globe, 
  ScrollText,
  UserCheck
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  highlight?: boolean;
}

export const Navbar: React.FC = () => {
  const { usuario, logout, isMestre } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const playerNavItems: NavItem[] = [
    { label: 'Personagens', path: '/', icon: <Shield className="w-4 h-4" /> },
    { label: 'Mapa', path: '/mapa', icon: <MapIcon className="w-4 h-4" /> },
    { label: 'Bestiário', path: '/bestiario', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Inventário & Craft', path: '/inventario', icon: <Package className="w-4 h-4" /> },
    { label: 'Wiki & Regras', path: '/wiki', icon: <ScrollText className="w-4 h-4" /> },
    { label: 'VTT 3D', path: '/vtt3d', icon: <Box className="w-4 h-4" />, badge: 'Em Breve' },
  ];

  const masterNavItems: NavItem[] = [
    { label: 'Painel Central', path: '/mestre', icon: <Crown className="w-4 h-4" /> },
    { label: 'Sessões Ao Vivo', path: '/mestre/sessoes', icon: <UserCheck className="w-4 h-4" />, highlight: true },
    { label: 'Fog-of-War & Mundo', path: '/mestre/mundo', icon: <Globe className="w-4 h-4" /> },
    { label: 'Jogadores & Contas', path: '/mestre/jogadores', icon: <Users className="w-4 h-4" /> },
  ];

  const currentNav = isMestre ? masterNavItems : playerNavItems;

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/90 backdrop-blur-md border-b border-[#2e3544] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-950 p-[1px] shadow-lg shadow-amber-950/40 group-hover:shadow-amber-500/20 transition-all">
              <div className="w-full h-full bg-[#12141c] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-left">
              <span className="font-decorative text-xl font-bold tracking-wider gold-gradient-text block leading-none">
                Thalúria
              </span>
              <span className="text-[10px] font-cinzel text-amber-500/70 tracking-widest uppercase block mt-0.5">
                Crônicas de Arcanum
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {currentNav.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded font-cinzel text-xs font-semibold uppercase tracking-wider transition-all relative ${
                    active
                      ? 'text-[#f3e5ab] bg-[#d4af37]/15 border border-[#d4af37]/40 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                      : 'text-[#8c93a4] hover:text-[#e6dfcf] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={active ? 'text-amber-400' : 'text-[#8c93a4]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-purple-950/80 text-purple-300 border border-purple-500/40 rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </Link>
              );
            })}

            {/* Alternar Mestre <-> Jogador para testes */}
            {isMestre && (
              <Link
                to="/"
                className="flex items-center gap-1.5 ml-2 px-2.5 py-1.5 rounded text-[11px] font-cinzel text-amber-400/80 border border-amber-600/30 hover:border-amber-400/60 hover:bg-amber-400/10 transition-colors"
                title="Visualizar plataforma na perspectiva de jogador"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Visão Jogador</span>
              </Link>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {usuario ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-cinzel text-xs font-bold text-[#f3e5ab]">
                      {usuario.username}
                    </span>
                    <Badge variant={isMestre ? 'danger' : 'gold'}>
                      {usuario.papel}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-[#8c93a4] font-sans-clean mt-0.5">
                    {isMestre ? (
                      <span className="text-amber-400/80">Acesso Irrestrito</span>
                    ) : (
                      <span>Pity: <strong className="text-amber-300">+{usuario.pity}</strong> • Limite: <strong className="text-amber-300">{usuario.limiteFichas}</strong></span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-[#8c93a4] hover:text-red-400 hover:bg-red-950/30 rounded border border-transparent hover:border-red-900/40 transition-colors cursor-pointer"
                  title="Encerrar Sessão"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-gold text-xs px-3.5 py-1.5 rounded font-cinzel"
              >
                Entrar
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
