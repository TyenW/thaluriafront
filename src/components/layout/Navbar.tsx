import React, { useState, useEffect } from 'react';
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
  UserCheck,
  Menu,
  X
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
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

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
    { label: 'Mapa Geral', path: '/mapa', icon: <MapIcon className="w-4 h-4" /> },
    { label: 'Jogadores & Contas', path: '/mestre/jogadores', icon: <Users className="w-4 h-4" /> },
  ];

  const currentNav = isMestre ? masterNavItems : playerNavItems;

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-md border-b border-[#2e3544] shadow-xl">
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

          {/* Desktop Navigation Links */}
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

          {/* User Profile, Actions & Mobile Hamburger Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {usuario ? (
              <div className="flex items-center gap-2 sm:gap-3">
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
                  className="hidden sm:flex p-2 text-[#8c93a4] hover:text-red-400 hover:bg-red-950/30 rounded border border-transparent hover:border-red-900/40 transition-colors cursor-pointer"
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

            {/* Botão Hambúrguer Mobile */}
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="flex md:hidden items-center justify-center p-2 rounded-lg bg-[#141724] border border-[#2b3346] text-[#e6dfcf] hover:text-amber-400 hover:border-amber-500/50 transition-colors cursor-pointer"
              aria-label={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              aria-expanded={menuAberto}
            >
              {menuAberto ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Gaveta / Dropdown Mobile */}
      {menuAberto && (
        <div className="md:hidden border-t border-[#2e3544] bg-[#0c0e15]/98 px-4 pt-3 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {usuario && (
            <div className="mb-4 pb-3 border-b border-[#1f2433] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-sm font-bold text-[#f3e5ab]">
                    {usuario.username}
                  </span>
                  <Badge variant={isMestre ? 'danger' : 'gold'}>
                    {usuario.papel}
                  </Badge>
                </div>
                <div className="text-[11px] text-[#8c93a4] font-sans-clean mt-0.5">
                  {isMestre ? (
                    <span className="text-amber-400/90 font-cinzel">Autoridade Máxima</span>
                  ) : (
                    <span>Pity: <strong className="text-amber-300">+{usuario.pity}</strong> • Limite: <strong className="text-amber-300">{usuario.limiteFichas} fichas</strong></span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 border border-red-700/50 hover:bg-red-900/60 rounded text-xs text-red-200 font-cinzel transition-all cursor-pointer"
                title="Encerrar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          )}

          <nav className="space-y-1.5">
            {currentNav.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg font-cinzel text-xs font-semibold uppercase tracking-wider transition-all ${
                    active
                      ? 'text-[#f3e5ab] bg-[#d4af37]/20 border border-[#d4af37]/50 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                      : 'text-[#9ca3af] hover:text-[#f3e5ab] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-amber-400' : 'text-[#8c93a4]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-500/40 rounded">
                        {item.badge}
                      </span>
                    )}
                    {item.highlight && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}

            {isMestre && (
              <Link
                to="/"
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-cinzel text-amber-300/90 border border-amber-600/40 hover:bg-amber-500/10 transition-colors mt-2"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Alternar para Visão de Jogador</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

