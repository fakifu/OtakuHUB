import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { UI } from '../../../designSystem';

export default function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Sélectionner',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  // Fermer si on clique ailleurs, scroll ou resize
  useEffect(() => {
    function handleEvents(event) {
      const isClickInsidePortal = event.target.closest('[data-portal="custom-select"]');
      if (wrapperRef.current && !wrapperRef.current.contains(event.target) && !isClickInsidePortal) {
        setIsOpen(false);
      }
    }

    const handleClose = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener('mousedown', handleEvents);
      window.addEventListener('scroll', handleClose, true);
      window.addEventListener('resize', handleClose);
    }

    return () => {
      document.removeEventListener('mousedown', handleEvents);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [isOpen]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const optsLength = Array.isArray(options) ? options.length : 0;
      const estimatedHeight = Math.min(optsLength * 52 + 16, 272);
      const shouldOpenUp = spaceBelow < estimatedHeight;

      setOpensUp(shouldOpenUp);
      setDropdownCoords({
        top: shouldOpenUp ? rect.top - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  // Détecter si la dropdown va dépasser le bas du viewport
  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  // Trouver le label de la valeur actuelle
  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || value || placeholder;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className={UI.forms.label}>
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`w-full flex justify-between items-center glass-panel rounded-card h-14 px-4 transition-all hover:border-accent ${isOpen
          ? 'ring-1 ring-accent/50 border-accent/50 bg-white/[0.08] dark:bg-white/[0.12]'
          : ''
          }`}
      >
        <span
          className={`truncate font-bold ${!value ? 'text-muted' : 'text-foreground'
            }`}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-foreground' : ''
            }`}
        />
      </button>

      {isOpen && createPortal(
        <div
          data-portal="custom-select"
          className={`fixed z-[20000] bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl max-h-64 overflow-y-auto custom-scrollbar animate-fade-in ${opensUp ? 'origin-bottom' : 'origin-top'}`}
          style={{
            top: opensUp ? 'auto' : `${dropdownCoords.top}px`,
            bottom: opensUp ? `${window.innerHeight - dropdownCoords.top}px` : 'auto',
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
          }}
        >
          <div className="p-2 space-y-1">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 rounded-list cursor-pointer flex justify-between items-center group transition-colors ${opt.value === value
                  ? 'bg-accent/20 text-accent font-black'
                  : 'text-foreground hover:bg-surface/50'
                  }`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                {opt.value === value && (
                  <Check size={14} className="text-accent" />
                )}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

