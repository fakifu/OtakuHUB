import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';

/**
 * Hook de transition native (Web View Transitions API).
 * Permet d'effectuer des animations de changement de page fluides à 60fps/120fps sans saccade.
 */
export const useNativeTransition = () => {
    const navigate = useNavigate();

    const transitionTo = useCallback((path) => {
        if ('startViewTransition' in document) {
            document.startViewTransition(() => {
                flushSync(() => {
                    navigate(path);
                });
            });
        } else {
            navigate(path);
        }
    }, [navigate]);

    return { transitionTo };
};
