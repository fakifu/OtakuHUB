import React from 'react';
import { UI } from '../../../designSystem';
import { useTranslation } from '../../../hooks/useTranslation';

export default function ShowMore({ isVisible, onClick }) {
  const { t } = useTranslation();
  if (!isVisible) return null;

  return (
    <div className="flex justify-center w-full">
      <button
        onClick={onClick}
        className={`${UI.cards.list} w-full py-3.5 flex justify-center items-center text-xs font-bold text-muted hover:text-foreground hover:border-accent/30 transition-all card-interactive group`}
      >
        <span className="tracking-[0.2em] uppercase">{t('common.showMore')}</span>
      </button>
    </div>
  );
}
