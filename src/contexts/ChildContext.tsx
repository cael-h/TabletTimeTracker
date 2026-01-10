import React, { createContext, useContext, useState } from 'react';

interface ChildContextType {
  activeChildId: string | null;
  setActiveChildId: (childId: string) => void;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const useChild = () => {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChild must be used within ChildProvider');
  }
  return context;
};

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeChildId, setActiveChildIdState] = useState<string | null>(() => {
    const stored = localStorage.getItem('activeChildId');
    return stored || null;
  });

  const setActiveChildId = (childId: string) => {
    setActiveChildIdState(childId);
    localStorage.setItem('activeChildId', childId);
  };

  return (
    <ChildContext.Provider value={{ activeChildId, setActiveChildId }}>
      {children}
    </ChildContext.Provider>
  );
};
