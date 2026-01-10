import React, { createContext, useContext, useState } from 'react';
import type { UserIdentity } from '../types';

interface IdentityContextType {
  identity: UserIdentity | null;
  setIdentity: (identity: UserIdentity) => void;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export const useIdentity = () => {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within IdentityProvider');
  }
  return context;
};

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [identity, setIdentityState] = useState<UserIdentity | null>(() => {
    const stored = localStorage.getItem('userIdentity');
    return (stored as UserIdentity) || null;
  });

  const setIdentity = (newIdentity: UserIdentity) => {
    setIdentityState(newIdentity);
    localStorage.setItem('userIdentity', newIdentity);
  };

  return (
    <IdentityContext.Provider value={{ identity, setIdentity }}>
      {children}
    </IdentityContext.Provider>
  );
};
