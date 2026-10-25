import React, { useState } from 'react';
import { BookOpen, Save, Undo2 } from 'lucide-react';
import type { FichaPersonagem, HistoriaFicha } from '../../types/ficha';
import { fichasService } from '../../services/fichasService';
import { Button } from '../common/Button';

const LIMITE = 20000;
const VAZIA: HistoriaFicha = { historia: '', aparencia: '', personalidade: '', anotacoes: '' };

const CAMPOS: { chave: keyof HistoriaFicha; titulo: string; dica: string; linhas: number }[] = [
  { chave: 'historia', titulo: 'História', dica: 'Origem, passado, eventos marcantes e como chegou até aqui.', linhas: 8 },
  { chave: 'aparencia', titulo: 'Aparência', dica: 'Traços físicos, roupas, marcas e o que chama atenção à primeira vista.', linhas: 4 },
  { chave: 'personalidade', titulo: 'Personalidade, ideais e vínculos', dica: 'Temperamento, crenças, medos, objetivos e pessoas importantes.', linhas: 4 },
  { chave: 'anotacoes', titulo: 'Anotações de campanha', dica: 'Pistas, nomes, dívidas, promessas e lembretes das sessões.', linhas: 6 },
];

/** Rascunhos não salvos por ficha: trocar de aba não descarta o que foi digitado. */
const rascunhos = new Map<number, HistoriaFicha>();

export interface AbaHistoriaProps {
  ficha: FichaPersonagem;
  onSalvo: (historia: HistoriaFicha) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const AbaHistoria: React.FC<AbaHistoriaProps> = ({ ficha, onSalvo, avisar }) => {
  const salva = { ...VAZIA, ...ficha.historia };
  const [form, setFormEstado] = useState<HistoriaFicha>(() => rascunhos.get(ficha.id) ?? salva);
  const [salvando, setSalvando] = useState(false);

  const setForm = (novo: HistoriaFicha) => {
    setFormEstado(novo);
    rascunhos.set(ficha.id, novo);
  };

  const alterados = CAMPOS.filter((c) => form[c.chave] !== salva[c.chave]);
  const excedido = CAMPOS.find((c) => form[c.chave].length > LIMITE);

  const salvar = async () => {
    if (alterados.length === 0 || excedido) return;
    setSalvando(true);
    try {
      const campos = Object.fromEntries(alterados.map((c) => [c.chave, form[c.chave]])) as Partial<HistoriaFicha>;
      const historia = await fichasService.salvarHistoria(ficha.id, campos);
      rascunhos.delete(ficha.id);
      setFormEstado({ ...VAZIA, ...historia });
      onSalvo(historia);
      avisar('sucesso', 'História salva.');
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar a história.');
    } finally {
      setSalvando(false);
    }
  };

  const descartar = () => {
    rascunhos.delete(ficha.id);
    setFormEstado(salva);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-abismo border border-linha">
        <div>
          <h3 className="flex items-center gap-2 font-cinzel text-sm font-bold text-amber-300 uppercase tracking-widest">
            <BookOpen className="w-5 h-5 text-amber-400" /> Quem é {ficha.nome}
          </h3>
          <p className="text-xs font-sans-clean mt-1 text-nevoa">
            {alterados.length > 0 ? (
              <span className="text-amber-300">Alterações não salvas em {alterados.map((c) => c.titulo.split(',')[0].toLowerCase()).join(', ')}.</span>
            ) : (
              'Tudo salvo.'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={descartar} disabled={alterados.length === 0 || salvando}>
            Descartar
          </Button>
          <Button
            id="btn-salvar-historia"
            variant="gold"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={salvar}
            loading={salvando}
            disabled={alterados.length === 0 || !!excedido}
          >
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CAMPOS.map((c) => {
          const tamanho = form[c.chave].length;
          return (
            <div key={c.chave} className={c.chave === 'historia' ? 'lg:col-span-2' : ''}>
              <label htmlFor={`textarea-${c.chave}`} className="flex justify-between gap-2 text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-1">
                <span>
                  {c.titulo}
                  {form[c.chave] !== salva[c.chave] && <span className="ml-1 text-amber-500" title="Alterado">•</span>}
                </span>
                <span className={`font-mono font-normal normal-case ${tamanho > LIMITE ? 'text-red-300' : 'text-apagado'}`}>
                  {tamanho.toLocaleString('pt-BR')}/{LIMITE.toLocaleString('pt-BR')}
                </span>
              </label>
              <textarea
                id={`textarea-${c.chave}`}
                rows={c.linhas}
                value={form[c.chave]}
                placeholder={c.dica}
                onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })}
                className={`w-full bg-abismo text-texto rounded-lg border px-3 py-2 text-sm font-sans-clean leading-relaxed outline-none focus:border-amber-400 ${
                  tamanho > LIMITE ? 'border-red-500/70' : 'border-linha-forte'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
