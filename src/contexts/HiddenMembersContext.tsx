import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'ttt-hidden-members';

interface HiddenMembersContextType {
  hiddenMemberIds: Set<string>;
  toggleHiddenMember: (memberId: string) => void;
  isHidden: (memberId: string) => boolean;
}

const HiddenMembersContext = createContext<HiddenMembersContextType | undefined>(undefined);

export const useHiddenMembers = () => {
  const context = useContext(HiddenMembersContext);
  if (!context) {
    throw new Error('useHiddenMembers must be used within HiddenMembersProvider');
  }
  return context;
};

export const HiddenMembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleHiddenMember = (memberId: string) => {
    setHiddenMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const isHidden = (memberId: string) => hiddenMemberIds.has(memberId);

  return (
    <HiddenMembersContext.Provider value={{ hiddenMemberIds, toggleHiddenMember, isHidden }}>
      {children}
    </HiddenMembersContext.Provider>
  );
};
