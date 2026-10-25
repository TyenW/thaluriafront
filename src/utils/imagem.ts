/** Limites aceitos ao enviar imagens do dispositivo (retratos, monstros, itens). */
export const ARQUIVO_IMAGEM_MAX_MB = 15;
export const DIMENSAO_IMAGEM_MAX = 512;

/** Verifica tipo e tamanho; devolve a mensagem de erro ou null. */
export function validarArquivoImagem(arquivo: File): string | null {
  if (!arquivo.type.startsWith('image/')) return 'Escolha um arquivo de imagem (PNG, JPG, WEBP…).';
  if (arquivo.size > ARQUIVO_IMAGEM_MAX_MB * 1024 * 1024) return `A imagem passa de ${ARQUIVO_IMAGEM_MAX_MB} MB.`;
  return null;
}

/**
 * Reduz a imagem para no máximo {@link DIMENSAO_IMAGEM_MAX}px e devolve um data URL leve.
 * Usa WEBP (preserva transparência) e cai para JPEG em navegadores sem suporte.
 */
export function otimizarImagem(arquivo: File, dimensaoMax = DIMENSAO_IMAGEM_MAX): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    leitor.onload = () => {
      const bruto = String(leitor.result);
      const img = new Image();
      img.onerror = () => reject(new Error('O arquivo não é uma imagem válida.'));
      img.onload = () => {
        const escala = Math.min(1, dimensaoMax / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(bruto);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const webp = canvas.toDataURL('image/webp', 0.85);
        resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = bruto;
    };
    leitor.readAsDataURL(arquivo);
  });
}
