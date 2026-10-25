import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ContaUsuario } from '../types/usuario';
import { authService } from '../services/authService';

interface AuthContextType {
  usuario: ContaUsuario | null;
  loading: boolean;
  login: (username: string, senha: string) => Promise<ContaUsuario>;
  logout: () => void;
  atualizarConta: (conta: Partial<ContaUsuario>) => void;
  isMestre: boolean;
  isJogador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<ContaUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const salvo = authService.getUsuarioSalvo();
    if (salvo) {
      setUsuario(salvo);
    }
    setLoading(false);
  }, []);

  const login = async (user: string, pass: string): Promise<ContaUsuario> => {
    const conta = await authService.login(user, pass);
    setUsuario(conta);
    return conta;
  };

  const logout = () => {
    authService.logout();
    setUsuario(null);
  };

  const atualizarConta = (dados: Partial<ContaUsuario>) => {
    if (!usuario) return;
    const novaConta = { ...usuario, ...dados };
    setUsuario(novaConta);
    authService.salvarUsuario(novaConta);
  };

  const isMestre = usuario?.papel === 'MESTRE';
  const isJogador = usuario?.papel === 'JOGADOR';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        logout,
        atualizarConta,
        isMestre,
        isJogador,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
