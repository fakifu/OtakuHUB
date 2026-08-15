import { useLayoutEffect } from 'react';

/**
 * Hook de verrouillage du défilement de l'arrière-plan (Body Scroll Lock).
 * Bloque l'effet rebond "Rubber-Band" d'iOS Safari lors de l'ouverture de modales ou overlays.
 */
export default function useLockBodyScroll(isLocked = true) {
  useLayoutEffect(() => {
    if (!isLocked) return;

    const styleId = 'lock-scroll-critical';
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.innerHTML = `
      body {
        overflow: hidden !important;
        overscroll-behavior: none !important;
      }
    `;

    let startY = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      let node = e.target.closest('.overflow-y-auto, .overflow-auto, .custom-scrollbar');
      let scrollable = null;

      while (node) {
        if (node.scrollHeight > node.clientHeight) {
          scrollable = node;
          break;
        }
        node = node.parentElement ? node.parentElement.closest('.overflow-y-auto, .overflow-auto, .custom-scrollbar') : null;
      }

      if (!scrollable) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      if (e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        const isDraggingDown = currentY > startY;
        const isDraggingUp = currentY < startY;

        const isAtTop = scrollable.scrollTop <= 0;
        const isAtBottom = Math.ceil(scrollable.scrollTop + scrollable.clientHeight) >= Math.floor(scrollable.scrollHeight) - 1;

        if ((isAtTop && isDraggingDown) || (isAtBottom && isDraggingUp)) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLocked]);
}
