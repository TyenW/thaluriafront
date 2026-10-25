import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ModalConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  children: React.ReactNode;
  textoConfirmar: string;
  perigoso?: boolean;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  aberto,
  titulo,
  children,
  textoConfirmar,
  perigoso = false,
  carregando = false,
  onConfirmar,
  onCancelar,
}) => (
  <Modal
    aberto={aberto}
    titulo={titulo}
    icone={<AlertTriangle className={`w-5 h-5 ${perigoso ? 'text-red-400' : 'text-amber-400'}`} />}
    onFechar={onCancelar}
    bloqueado={carregando}
    tamanho="sm"
    tom={perigoso ? 'danger' : 'gold'}
  >
    <div className="text-xs text-texto-2 font-sans-clean leading-relaxed mb-6">{children}</div>
    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={onCancelar} disabled={carregando}>
        Cancelar
      </Button>
      <Button variant={perigoso ? 'danger' : 'gold'} size="sm" onClick={onConfirmar} loading={carregando}>
        {textoConfirmar}
      </Button>
    </div>
  </Modal>
);
