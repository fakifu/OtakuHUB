import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const location = useLocation();

  // Mémoire générique des onglets
  const [memory, setMemory] = useState({
    dashboard: '/',
    tab2: '/tab2',
    tab3: '/tab3',
    settings: '/settings',
  });

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    const path = location.pathname;

    if (path.startsWith('/tab2')) {
      setMemory((p) => ({ ...p, tab2: fullPath }));
    } else if (path.startsWith('/tab3')) {
      setMemory((p) => ({ ...p, tab3: fullPath }));
    } else if (path.startsWith('/settings')) {
      setMemory((p) => ({ ...p, settings: fullPath }));
    } else if (path === '/') {
      setMemory((p) => ({ ...p, dashboard: fullPath }));
    }
  }, [location.pathname, location.search]);

  return (
    <NavigationContext.Provider value={{ memory }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);