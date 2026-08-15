import { useCallback } from 'react';

/**
 * Hook de verrouillage de l'orientation portrait PWA mobile.
 */
export const useOrientationLock = () => {
    const lockToPortrait = useCallback(async () => {
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
            try {
                await window.screen.orientation.lock('portrait');
            } catch (err) {
                console.warn("Orientation lock non supporté hors plein écran PWA", err);
            }
        }
    }, []);

    return { lockToPortrait, needsLandscapeOverlay: false };
};
