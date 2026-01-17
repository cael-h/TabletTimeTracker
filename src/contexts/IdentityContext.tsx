import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserIdentity } from '../types';

interface IdentityContextType {
  identity: UserIdentity | null;
  setIdentity: (identity: UserIdentity) => void;
  // New: function to sync identity from member displayName
  syncFromMember: (displayName: string) => void;
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
    // Still check localStorage for backward compatibility during migration
    const stored = localStorage.getItem('userIdentity');
    return (stored as UserIdentity) || null;
  });

  const setIdentity = useCallback((newIdentity: UserIdentity) => {
    setIdentityState(newIdentity);
    localStorage.setItem('userIdentity', newIdentity);
  }, []);

  // Sync identity from member's displayName (called when member data is available)
  const syncFromMember = useCallback((displayName: string) => {
    if (displayName && displayName !== identity) {
      setIdentityState(displayName);
      localStorage.setItem('userIdentity', displayName);
    }
  }, [identity]);

  return (
    <IdentityContext.Provider value={{ identity, setIdentity, syncFromMember }}>
      {children}
    </IdentityContext.Provider>
  );
};
