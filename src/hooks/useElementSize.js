import { useState, useEffect, useRef } from 'react';

/**
 * Hook to measure exact DOM element dimensions using ResizeObserver.
 * Critical for Recharts to prevent width(-1) / height(-1) mounting errors.
 */
export function useElementSize() {
    const ref = useRef(null);
    const [size, setSize] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        const observeTarget = ref.current;
        if (!observeTarget) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                let width, height;
                if (entry.contentBoxSize && entry.contentBoxSize[0]) {
                    width = entry.contentBoxSize[0].inlineSize;
                    height = entry.contentBoxSize[0].blockSize;
                } else {
                    width = entry.contentRect.width;
                    height = entry.contentRect.height;
                }

                setSize({ width, height });
            }
        });

        resizeObserver.observe(observeTarget);

        return () => {
            if (observeTarget) {
                resizeObserver.unobserve(observeTarget);
            }
        };
    }, []);

    return [ref, size];
}
