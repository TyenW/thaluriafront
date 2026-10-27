import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldAlert, 
  Plus, 
  Minus, 
  Sparkles,
  Pencil,
  Crown,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import type { PapelUsuario } from '../../types/usuario';

interface UsuarioResumo {
  id: number;
  username: string;
  papel: PapelUsuario;
  limiteFichas: number;
  pity: number;
  totalFichas: number;
}

export const GerenciarJogadoresPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  
  // Formulário de Cadastro / Edição
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<PapelUsuario>('JOGADOR');
  const [limiteFichas, setLimiteFichas] = useState(2);
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Exclusão de Conta de Usuário
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioResumo | null>(null);
  const [excluindoUsuario, setExcluindoUsuario] = useState(false);

  const carregarUsuarios = async () => {
    setLoadingLista(true);
    try {
      const data = await mundoService.listarUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setErro(err.message || 'Falha ao carregar lista de usuários.');
    } finally {
      setLoadingLista(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleExcluirUsuario = async () => {
    if (!usuarioParaExcluir) return;
    setExcluindoUsuario(true);
    setErro(null);
    setSucesso(null);
    try {
      await mundoService.excluirUsuario(usuarioParaExcluir.id);
      setSucesso(`A conta "${usuarioParaExcluir.username}" e todos os seus dados vinculados foram excluídos com sucesso!`);
      if (username === usuarioParaExcluir.username) {
        setUsername('');
        setSenha('');
        setLimiteFichas(2);
      }
      setUsuarioParaExcluir(null);
      await carregarUsuarios();
    } catch (err: any) {
      setErro(err.message || 'Falha ao excluir conta de usuário.');
    } finally {
      setExcluindoUsuario(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErro('Informe o nome de usuário.');
      return;
    }

    setLoadingAcao(true);
    setSucesso(null);
    setErro(null);

    try {
      const res = await mundoService.cadastrarOuAlterarUsuario(
        username.trim(),
        senha,
        papel,
        limiteFichas
      );
      setSucesso(`Conta "${res.username}" salva com sucesso! Limite atual: ${res.limiteFichas} fichas.`);
      setUsername('');
      setSenha('');
      setLimiteFichas(2);
      await carregarUsuarios();
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar usuário no banco SQLite.');
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleAjustarLimiteRapido = async (user: UsuarioResumo, delta: number) => {
    const novoLimite = Math.max(1, user.limiteFichas + delta);
    if (novoLimite === user.limiteFichas) return;

    try {
      await mundoService.cadastrarOuAlterarUsuario(user.username, undefined, user.papel, novoLimite);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, limiteFichas: novoLimite } : u))
      );
      setSucesso(`Limite de fichas de "${user.username}" alterado para ${novoLimite}!`);
    } catch (err: any) {
      setErro(err.message || 'Falha ao ajustar limite de fichas.');
    }
  };

  const handleCarregarParaEdicao = (u: UsuarioResumo) => {
    setUsername(u.username);
    setPapel(u.papel);
    setLimiteFichas(u.limiteFichas);
    setSucesso(`Dados de "${u.username}" carregados para edição.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalFichasCampanha = usuarios.reduce((acc, u) => acc + (u.totalFichas || 0), 0);

  const acoesConta = (u: UsuarioResumo) => (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={() => handleAjustarLimiteRapido(u, -1)}
        disabled={u.limiteFichas <= 1}
        className="p-2 rounded-md bg-painel-alto hover:bg-red-950/60 border border-linha-forte hover:border-red-600/50 text-gray-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Diminuir Limite de Fichas em 1"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => handleAjustarLimiteRapido(u, 1)}
        className="p-2 rounded-md bg-painel-alto hover:bg-emerald-950/60 border border-linha-forte hover:border-emerald-600/50 text-gray-400 hover:text-emerald-300 transition-all cursor-pointer"
        title="Aumentar Limite de Fichas em 1"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => handleCarregarParaEdicao(u)}
        className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/30 hover:bg-amber-900/50 border border-amber-600/40 text-[11px] font-cinzel text-amber-300 transition-all cursor-pointer"
        title="Editar senha ou papel da conta"
      >
        <Pencil className="w-3 h-3" />
        <span>Editar</span>
      </button>

      {u.username.toLowerCase() !== 'mestre' && (
        <button
          onClick={() => setUsuarioParaExcluir(u)}
          className="p-2 rounded-md bg-painel-alto hover:bg-red-950/80 border border-linha-forte hover:border-red-600/70 text-gray-400 hover:text-red-300 transition-all cursor-pointer"
          title={`Excluir permanentemente a conta "${u.username}"`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left pb-16">
      
      {/* Header Administrativo */}
      <div className="border-b border-linha pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="danger">
              <Crown className="w-3 h-3 text-amber-300" />
              <span>Painel do Mestre</span>
            </Badge>
            <Badge variant="gold">{usuarios.length} Contas Registradas</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-pergaminho flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-400" />
            <span>Administração de Contas & Limites de Fichas</span>
          </h1>
          <p className="text-xs text-nevoa font-sans-clean mt-1">
            Gerencie os jogadores da campanha, expanda limites de personagens e consulte o acúmulo de Pity.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={carregarUsuarios}
          loading={loadingLista}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Atualizar Lista
        </Button>
      </div>

      {/* Alertas */}
      {sucesso && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-3 text-emerald-200 text-xs font-sans-clean">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {erro && (
        <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-xs font-sans-clean">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Grid: Formulário de Inscrição + Resumo da Campanha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulário de Criação / Edição */}
        <Card variant="grimorio" className="lg:col-span-2 p-6 sm:p-8">
          <div className="flex items-center gap-2 border-b border-linha pb-3 mb-5">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinzel text-base font-bold text-pergaminho">
              {username ? `Atualizar Conta: ${username}` : 'Cadastrar Novo Aventureiro ou Mestre'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome de Usuário (Login)"
                placeholder="Ex: arcanista ou jogador3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <Input
                label="Senha de Acesso"
                type="text"
                placeholder={usuarios.some((u) => u.username === username.trim()) ? 'Em branco = manter a senha atual' : 'Em branco = 123456'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1.5">
                  Papel de Acesso
                </label>
                <select
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as PapelUsuario)}
                  className="w-full bg-abismo text-pergaminho rounded-lg border border-linha-forte px-3.5 py-2.5 text-sm outline-none focus:border-ouro"
                >
                  <option value="JOGADOR">Jogador (Acesso Padrão)</option>
                  <option value="MESTRE">Mestre (Poder Supremo & FOW)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-ouro/90 mb-1.5">
                  Limite Máximo de Fichas
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={limiteFichas}
                  onChange={(e) => setLimiteFichas(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-abismo text-pergaminho rounded-lg border border-linha-forte px-3.5 py-2.5 text-sm outline-none focus:border-ouro"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <Button
                type="submit"
                variant="gold"
                size="md"
                loading={loadingAcao}
                icon={<UserPlus className="w-4 h-4" />}
                className="flex-1 justify-center font-bold tracking-wider uppercase font-cinzel"
              >
                {username ? 'Salvar Alterações da Conta' : 'Criar Conta no Banco SQLite'}
              </Button>

              {username && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setUsername('');
                    setSenha('');
                    setLimiteFichas(2);
                    setSucesso(null);
                  }}
                  title="Cancelar edição e voltar ao modo de cadastro"
                >
                  Limpar
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Resumo da Campanha */}
        <Card variant="grimorio" className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-cinzel text-sm font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Censo da Campanha</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-abismo rounded-lg border border-linha flex items-center justify-between">
                <span className="text-xs font-cinzel text-nevoa">Total de Contas:</span>
                <strong className="text-base font-cinzel text-amber-300 font-bold">{usuarios.length}</strong>
              </div>

              <div className="p-3 bg-abismo rounded-lg border border-linha flex items-center justify-between">
                <span className="text-xs font-cinzel text-nevoa">Fichas Ativas no Mundo:</span>
                <strong className="text-base font-cinzel text-emerald-300 font-bold">{totalFichasCampanha}</strong>
              </div>

              <div className="p-3 bg-abismo rounded-lg border border-linha flex items-center justify-between">
                <span className="text-xs font-cinzel text-nevoa">Mestres Registrados:</span>
                <strong className="text-base font-cinzel text-purple-300 font-bold">
                  {usuarios.filter((u) => u.papel === 'MESTRE').length}
                </strong>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-nevoa font-sans-clean leading-relaxed italic border-t border-linha pt-3">
            O Pity acumula a cada tentativa de criação sem raça mítica e zera ao escolher Draconatos.
          </p>
        </Card>
      </div>

      {/* Tabela de Contas dos Jogadores */}
      <Card variant="grimorio" className="p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-linha pb-4 mb-4">
          <h3 className="font-cinzel text-base font-bold text-pergaminho flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Contas Registradas na Mesa ({usuarios.length})</span>
          </h3>
          <span className="text-xs font-cinzel text-nevoa">
            Ajustes de limites têm efeito imediato
          </span>
        </div>

        <ul className="md:hidden divide-y divide-linha">
          {usuarios.map((u) => {
            const atingiuLimite = (u.totalFichas || 0) >= u.limiteFichas;
            return (
              <li key={u.id} className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-cinzel font-bold text-pergaminho truncate">{u.username}</span>
                  <Badge variant={u.papel === 'MESTRE' ? 'danger' : 'gold'} size="sm">
                    {u.papel}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-nevoa">
                  <span className="font-mono">#{u.id}</span>
                  <span>
                    Fichas: <strong className={`font-mono ${atingiuLimite ? 'text-red-400' : 'text-emerald-400'}`}>{u.totalFichas || 0} / {u.limiteFichas}</strong>
                  </span>
                  <span>
                    Pity: <strong className="font-mono text-amber-300">+{u.pity || 0}</strong>
                  </span>
                </div>
                <div className="flex justify-end">{acoesConta(u)}</div>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-sans-clean">
            <thead>
              <tr className="border-b border-linha text-nevoa font-cinzel uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Usuário</th>
                <th className="py-3 px-3">Papel</th>
                <th className="py-3 px-3">Fichas / Limite</th>
                <th className="py-3 px-3">Fator Pity</th>
                <th className="py-3 px-3 text-right">Ajuste Rápido de Limite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {usuarios.map((u) => {
                const atingiuLimite = (u.totalFichas || 0) >= u.limiteFichas;

                return (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-nevoa">#{u.id}</td>
                    
                    <td className="py-3 px-3 font-bold font-cinzel text-pergaminho">
                      {u.username}
                    </td>

                    <td className="py-3 px-3">
                      <Badge variant={u.papel === 'MESTRE' ? 'danger' : 'gold'} size="sm">
                        {u.papel}
                      </Badge>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${atingiuLimite ? 'text-red-400' : 'text-emerald-400'}`}>
                          {u.totalFichas || 0} / {u.limiteFichas}
                        </span>
                        {atingiuLimite && (
                          <span className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800 text-[10px] text-red-300 font-cinzel">
                            Teto Atingido
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>+{u.pity || 0}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {acoesConta(u)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Confirmação de Exclusão de Conta */}
      {usuarioParaExcluir && (
        <div className="fixed inset-0 m-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-painel border border-red-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 text-left">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-cinzel font-bold text-red-100">
                Confirmar Exclusão de Conta
              </h3>
            </div>
            <p className="text-xs text-texto-2 font-sans-clean leading-relaxed mb-4">
              Tem certeza de que deseja apagar a conta de jogador <strong className="text-amber-300 font-cinzel font-bold">{usuarioParaExcluir.username}</strong> (ID #{usuarioParaExcluir.id})?
            </p>
            {usuarioParaExcluir.totalFichas > 0 && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-300 text-[11px] mb-4">
                ⚠️ <strong>Atenção:</strong> Esta conta possui <strong>{usuarioParaExcluir.totalFichas} ficha(s)</strong> no mundo. Todas as fichas, perícias e inventários pertencentes a este jogador também serão permanentemente excluídos do SQLite!
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUsuarioParaExcluir(null)}
                disabled={excluindoUsuario}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExcluirUsuario}
                loading={excluindoUsuario}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Sim, Excluir Conta & Fichas
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
