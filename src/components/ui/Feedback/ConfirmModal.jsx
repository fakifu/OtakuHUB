import React from 'react';
import Modal from '../Layout/Modal';
import { AlertTriangle } from 'lucide-react';
import { UI } from '../../../designSystem';
import Button from '../Primitives/Button';
import { useTranslation } from '../../../hooks/useTranslation';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isDanger = false }) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type="alert"
      footer={
        <div className="flex items-center justify-center gap-4 pb-2 w-full">
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => { onConfirm(); onClose(); }}
            variant={isDanger ? 'danger' : 'primary'}
            className="flex-1"
          >
            {t('common.confirm')}
          </Button>
        </div>
      }
    >
      <div className="p-8 pb-4 text-center space-y-6 bg-transparent">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isDanger ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent'
          }`}>
          <AlertTriangle size={32} strokeWidth={2.5} />
        </div>

        <div>
          <h3 className={`${UI.text.h2} text-foreground mb-2 uppercase tracking-widest`}>{title}</h3>
          <p className="text-muted text-sm leading-relaxed px-4">{message}</p>
        </div>

      </div>
    </Modal >
  );
}