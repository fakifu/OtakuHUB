/**
 * AuroraContext — stub minimal
 * Le fond Aurora est désormais piloté directement par useTheme() dans AuroraBackground.
 * Ce contexte est conservé dans l'arbre de providers (main.jsx) mais ne fait plus rien.
 */
import React, { createContext, useContext } from 'react';

const AuroraContext = createContext(null);

export function AuroraProvider({ children }) {
    return <AuroraContext.Provider value={{}}>{children}</AuroraContext.Provider>;
}

export function useAurora() {
    return useContext(AuroraContext) ?? {};
}
