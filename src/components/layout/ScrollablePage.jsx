import React, { useRef } from 'react';
import { UI } from '../../designSystem';

// --- PAGE TRANSITION (iOS-safe) -------------------------------------------
// Animation CSS pure pour les transitions de page.
// La classe .page-enter (définie dans index.css) déclenche un fade-in de 210ms
// sur le compositor thread de WebKit — aucun JS, aucun jank possible.
// Le remontage du composant via key={location.pathname} (dans Layout.jsx) 
// relance automatiquement la keyframe à chaque navigation.
// --------------------------------------------------------------------------

export default function ScrollablePage({ children, onScrollChange, className = '' }) {
  const scrollRef = useRef(null);

  const handleScroll = (e) => {
    const y = e.target.scrollTop;
    if (onScrollChange) onScrollChange(y > 20);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-scroll', { detail: { scrollTop: y } }));
    }
  };

  return (
    // page-enter : déclenche la keyframe CSS à chaque montage
    // col-start-1 row-start-1 : position dans la grille Layout (zone unique pour les pages)
    <div className="col-start-1 row-start-1 w-full h-full min-h-0 relative z-10 page-enter">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`h-full w-full overflow-y-auto overflow-x-clip custom-scrollbar pb-32 ${className}`}
      >
        <div className="w-full relative min-h-full max-w-lg mx-auto overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}