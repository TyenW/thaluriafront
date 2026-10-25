import React, { useEffect, useState } from 'react';
import { Camera, Image as ImageIcon, Save, Trash2, Upload } from 'lucide-react';
import { fichasService } from '../../services/fichasService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

const DIMENSAO_MAX = 512;
const ARQUIVO_MAX_MB = 15;

/** Reduz a imagem para no máximo 512px (JPEG) para caber leve no banco. */
function otimizarImagem(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    leitor.onload = () => {
      const bruto = String(leitor.result);
      const img = new Image();
      img.onerror = () => reject(new Error('O arquivo não é uma imagem válida.'));
      img.onload = () => {
        const escala = Math.min(1, DIMENSAO_MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(bruto);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = bruto;
    };
    leitor.readAsDataURL(arquivo);
  });
}

export interface ModalRetratoProps {
  aberto: boolean;
  fichaId: number;
  imagemAtual?: string;
  onFechar: () => void;
  onSalvo: (imagemUrl: string) => void;
  avisar: (tipo: 'sucesso' | 'erro', texto: string) => void;
}

export const ModalRetrato: React.FC<ModalRetratoProps> = ({ aberto, fichaId, imagemAtual, onFechar, onSalvo, avisar }) => {
  const [valor, setValor] = useState('');
  const [previaQuebrada, setPreviaQuebrada] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setValor(imagemAtual || '');
      setPreviaQuebrada(false);
      setErroArquivo(null);
    }
  }, [aberto, imagemAtual]);

  const salvarImagem = async (nova: string) => {
    setSalvando(true);
    try {
      await fichasService.atualizarFicha({ id: fichaId, imagemUrl: nova });
      onSalvo(nova);
      avisar('sucesso', nova ? 'Retrato salvo.' : 'Retrato removido.');
      onFechar();
    } catch (err: any) {
      avisar('erro', err.message || 'Não foi possível salvar o retrato.');
    } finally {
      setSalvando(false);
    }
  };

  const aoEscolherArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      setErroArquivo('Escolha um arquivo de imagem (PNG, JPG, WEBP…).');
      return;
    }
    if (arquivo.size > ARQUIVO_MAX_MB * 1024 * 1024) {
      setErroArquivo(`A imagem passa de ${ARQUIVO_MAX_MB} MB.`);
      return;
    }
    try {
      setErroArquivo(null);
      setPreviaQuebrada(false);
      setValor(await otimizarImagem(arquivo));
    } catch (err: any) {
      setErroArquivo(err.message);
    }
  };

  const valorLimpo = valor.trim();
  const podeSalvar = valorLimpo !== (imagemAtual || '') && !previaQuebrada;

  return (
    <Modal aberto={aberto} titulo="Retrato do personagem" icone={<Camera className="w-5 h-5 text-amber-400" />} onFechar={onFechar} bloqueado={salvando} tamanho="sm">
      <div className="flex flex-col items-center mb-5">
        <div className="w-32 h-32 rounded-2xl bg-[#090b10] border-2 border-amber-500/60 overflow-hidden flex items-center justify-center mb-2">
          {valorLimpo && !previaQuebrada ? (
            <img src={valorLimpo} alt="Pré-visualização do retrato" className="w-full h-full object-cover" onError={() => setPreviaQuebrada(true)} />
          ) : (
            <div className="text-center p-3 text-gray-500">
              <ImageIcon className="w-10 h-10 mx-auto mb-1 text-gray-600" />
              <span className="text-[10px] font-cinzel">{previaQuebrada ? 'Imagem inválida' : 'Sem imagem'}</span>
            </div>
          )}
        </div>
        {previaQuebrada && <p className="text-[11px] text-red-300 text-center">Não foi possível carregar a imagem desse endereço.</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (podeSalvar) salvarImagem(valorLimpo);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="input-url-foto" className="block text-xs font-cinzel text-amber-400 font-semibold mb-1">
            Endereço (URL) da imagem
          </label>
          <input
            id="input-url-foto"
            type="url"
            placeholder="https://exemplo.com/retrato.png"
            value={valor.startsWith('data:') ? '' : valor}
            onChange={(e) => {
              setValor(e.target.value);
              setPreviaQuebrada(false);
            }}
            className="w-full bg-[#090b10] text-[#f3e5ab] rounded-lg border border-[#383d4e] px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
          />
          {valor.startsWith('data:') && <p className="text-[10px] text-[#8c93a4] mt-1">Usando imagem enviada do dispositivo.</p>}
        </div>

        <div className="text-center text-xs font-cinzel text-gray-500">— ou —</div>

        <div>
          <label className="flex items-center justify-center gap-2 p-3 bg-[#161a26] hover:bg-[#1f2536] border border-dashed border-amber-500/40 hover:border-amber-400 rounded-lg cursor-pointer transition-colors text-xs font-cinzel text-amber-300">
            <Upload className="w-4 h-4" />
            <span>Enviar imagem do dispositivo</span>
            <input id="input-upload-foto" type="file" accept="image/*" onChange={aoEscolherArquivo} className="sr-only" />
          </label>
          {erroArquivo && <p className="text-[11px] text-red-300 mt-1">{erroArquivo}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-4 border-t border-[#252b3a]">
          {imagemAtual && (
            <Button
              id="btn-remover-foto"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => salvarImagem('')}
              disabled={salvando}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-red-300 hover:text-red-200 sm:mr-auto"
            >
              Remover retrato
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onFechar} disabled={salvando} className={imagemAtual ? '' : 'sm:ml-auto'}>
            Cancelar
          </Button>
          <Button id="btn-salvar-foto" type="submit" variant="gold" size="sm" loading={salvando} disabled={!podeSalvar} icon={<Save className="w-3.5 h-3.5" />}>
            Salvar retrato
          </Button>
        </div>
      </form>
    </Modal>
  );
};
