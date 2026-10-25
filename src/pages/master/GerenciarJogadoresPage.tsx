import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Users, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { mundoService } from '../../services/mundoService';
import type { PapelUsuario } from '../../types/usuario';

export const GerenciarJogadoresPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('123456');
  const [papel, setPapel] = useState<PapelUsuario>('JOGADOR');
  const [limiteFichas, setLimiteFichas] = useState(2);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErro('Informe o nome de usuário.');
      return;
    }

    setLoading(true);
    setSucesso(null);
    setErro(null);

    try {
      const res = await mundoService.cadastrarOuAlterarUsuario(
        username.trim(),
        senha,
        papel,
        limiteFichas
      );
      setSucesso(`Usuário "${res.username}" salvo com sucesso! Limite de fichas: ${res.limiteFichas}.`);
      setUsername('');
      setSenha('123456');
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar usuário no banco SQLite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="border-b border-[#252b3a] pb-4">
        <h1 className="text-2xl font-cinzel font-bold text-[#f3e5ab] flex items-center gap-3">
          <Users className="w-6 h-6 text-amber-400" />
          <span>Administração de Contas & Limites de Fichas</span>
        </h1>
        <p className="text-xs text-[#8c93a4] font-sans-clean mt-1">
          Crie contas para os aventureiros da sua mesa ou expanda o limite de personagens de uma conta existente.
        </p>
      </div>

      <Card variant="grimorio" className="p-6 sm:p-8">
        {sucesso && (
          <div className="mb-6 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sucesso}</span>
          </div>
        )}

        {erro && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-500/40 rounded flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome de Usuário (Login)"
            placeholder="Ex: jogador2 ou arcanista"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label="Senha de Acesso"
            type="text"
            placeholder="Padrão: 123456"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-[#d4af37]/90 mb-1.5">
                Papel na Mesa
              </label>
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value as PapelUsuario)}
                className="w-full bg-[#0d0f15]/90 text-[#f3e5ab] rounded border border-[#383d4e] px-3.5 py-2.5 text-sm outline-none focus:border-[#d4af37]"
              >
                <option value="JOGADOR">Jogador</option>
                <option value="MESTRE">Mestre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-[#d4af37]/90 mb-1.5">
                Limite de Fichas Permitidas
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={limiteFichas}
                onChange={(e) => setLimiteFichas(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0d0f15]/90 text-[#f3e5ab] rounded border border-[#383d4e] px-3.5 py-2.5 text-sm outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={loading}
            icon={<UserPlus className="w-4 h-4" />}
            className="w-full mt-4"
          >
            Salvar / Atualizar Conta
          </Button>
        </form>
      </Card>
    </div>
  );
};
