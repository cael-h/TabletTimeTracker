import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChildContextType {
  activeChildId: string | null;
  setActiveChildId: (childId: string) => void;
  // New: function to sync childId from member's childId (for kids)
  syncFromMember: (childId: string | undefined) => void;
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

  const setActiveChildId = useCallback((childId: string) => {
    setActiveChildIdState(childId);
    localStorage.setItem('activeChildId', childId);
  }, []);

  // Sync childId from member's childId (called for kids who have a linked profile)
  const syncFromMember = useCallback((childId: string | undefined) => {
    if (childId && childId !== activeChildId) {
      setActiveChildIdState(childId);
      localStorage.setItem('activeChildId', childId);
    }
  }, [activeChildId]);

  return (
    <ChildContext.Provider value={{ activeChildId, setActiveChildId, syncFromMember }}>
      {children}
    </ChildContext.Provider>
  );
};
