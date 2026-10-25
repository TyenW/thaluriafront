import React, { useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { otimizarImagem, validarArquivoImagem } from '../../utils/imagem';

export interface CampoImagemProps {
  id: string;
  valor: string;
  onAlterar: (valor: string) => void;
  /** Formato da moldura de pré-visualização. */
  formato?: 'quadrado' | 'retrato';
  rotuloVazio?: string;
}

/** Envio de imagem do dispositivo (reduzida a 512px) ou por endereço http(s), com pré-visualização. */
export const CampoImagem: React.FC<CampoImagemProps> = ({ id, valor, onAlterar, formato = 'quadrado', rotuloVazio = 'Sem imagem' }) => {
  const [erro, setErro] = useState<string | null>(null);
  const [quebrada, setQuebrada] = useState(false);
  const [processando, setProcessando] = useState(false);

  const aoEscolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    const invalido = validarArquivoImagem(arquivo);
    if (invalido) return setErro(invalido);
    setProcessando(true);
    try {
      setErro(null);
      setQuebrada(false);
      onAlterar(await otimizarImagem(arquivo));
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setProcessando(false);
    }
  };

  const moldura = formato === 'retrato' ? 'w-28 h-36' : 'w-28 h-28';
  const temImagem = !!valor && !quebrada;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <div className={`${moldura} shrink-0 rounded-xl bg-abismo border border-linha-forte overflow-hidden flex items-center justify-center`}>
        {temImagem ? (
          <img src={valor} alt="Pré-visualização" className="w-full h-full object-cover" onError={() => setQuebrada(true)} />
        ) : (
          <span className="text-center p-2 text-apagado">
            <ImageIcon className="w-8 h-8 mx-auto mb-1" />
            <span className="text-[10px] font-cinzel">{quebrada ? 'Imagem inválida' : rotuloVazio}</span>
          </span>
        )}
      </div>

      <div className="flex-1 w-full space-y-2">
        <label className="flex items-center justify-center gap-2 p-2.5 bg-painel-alto hover:bg-painel-alto/70 border border-dashed border-ouro/40 hover:border-ouro rounded-lg cursor-pointer transition-colors text-xs font-cinzel text-amber-300">
          <Upload className="w-4 h-4" />
          <span>{processando ? 'Preparando imagem…' : 'Enviar do dispositivo'}</span>
          <input id={id} type="file" accept="image/*" onChange={aoEscolher} className="sr-only" />
        </label>
        <input
          type="url"
          aria-label="Endereço (URL) da imagem"
          placeholder="ou cole um endereço https://…"
          value={valor.startsWith('data:') ? '' : valor}
          onChange={(e) => {
            setQuebrada(false);
            onAlterar(e.target.value.trim());
          }}
          className="campo font-mono text-xs"
        />
        <div className="flex items-center justify-between gap-2 min-h-5">
          {valor.startsWith('data:') ? <span className="text-[10px] text-nevoa">Imagem enviada do dispositivo.</span> : <span />}
          {valor && (
            <button type="button" onClick={() => onAlterar('')} className="inline-flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200 cursor-pointer">
              <Trash2 className="w-3 h-3" /> Remover
            </button>
          )}
        </div>
        {erro && <p className="text-[11px] text-red-300">{erro}</p>}
      </div>
    </div>
  );
};
