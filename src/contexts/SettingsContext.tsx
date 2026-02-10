import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Settings, SettingsDoc, Child, ChildDoc } from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';

const DEFAULT_REWARD_REASONS = [
  'Brushed Teeth',
  'Cleaned Room',
  'Ate Dinner',
  'Homework',
  'Helped Sister',
];

const DEFAULT_REDEMPTION_REASONS = ['Tablet', 'TV', 'Switch'];

const DEFAULT_CHORE_REASONS = [
  'Dishes',
  'Laundry',
  'Vacuuming',
  'Took Out Trash',
  'Cooked Meal',
];

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (updates: Partial<SettingsDoc>) => Promise<void>;
  addRewardReason: (reason: string) => Promise<void>;
  removeRewardReason: (reason: string) => Promise<void>;
  addRedemptionReason: (reason: string) => Promise<void>;
  removeRedemptionReason: (reason: string) => Promise<void>;
  addChoreReason: (reason: string) => Promise<void>;
  removeChoreReason: (reason: string) => Promise<void>;
  addChild: (childName: string, color?: string) => Promise<void>;
  removeChild: (childId: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { family } = useFamily();

  useEffect(() => {
    if (!user || !family) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const settingsDoc = doc(db, `families/${family.id}/settings/config`);

    // Initialize settings if they don't exist
    const initializeSettings = async () => {
      const docSnap = await getDoc(settingsDoc);
      if (!docSnap.exists()) {
        const defaultSettings: SettingsDoc = {
          rewardReasons: DEFAULT_REWARD_REASONS,
          redemptionReasons: DEFAULT_REDEMPTION_REASONS,
          choreReasons: DEFAULT_CHORE_REASONS,
          children: [],
        };
        await setDoc(settingsDoc, defaultSettings);
      }
    };

    initializeSettings().catch(console.error);

    const unsubscribe = onSnapshot(
      settingsDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SettingsDoc;
          const childList: Child[] = (data.children || []).map((childDoc: ChildDoc & { id?: string }) => ({
            id: childDoc.id || childDoc.name.toLowerCase().replace(/\s+/g, '-'),
            name: childDoc.name,
            createdAt: childDoc.createdAt?.toDate() || new Date(),
            color: childDoc.color,
          }));
          setSettings({
            id: snapshot.id,
            rewardReasons: data.rewardReasons,
            redemptionReasons: data.redemptionReasons,
            choreReasons: data.choreReasons || DEFAULT_CHORE_REASONS,
            children: childList,
          });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching settings:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, family]);

  const updateSettings = async (updates: Partial<SettingsDoc>) => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const settingsDoc = doc(db, `families/${family.id}/settings/config`);
    await setDoc(settingsDoc, updates, { merge: true });
  };

  const addRewardReason = async (reason: string) => {
    if (!settings) return;
    const newReasons = [...settings.rewardReasons, reason];
    await updateSettings({ rewardReasons: newReasons });
  };

  const removeRewardReason = async (reason: string) => {
    if (!settings) return;
    const newReasons = settings.rewardReasons.filter((r) => r !== reason);
    await updateSettings({ rewardReasons: newReasons });
  };

  const addRedemptionReason = async (reason: string) => {
    if (!settings) return;
    const newReasons = [...settings.redemptionReasons, reason];
    await updateSettings({ redemptionReasons: newReasons });
  };

  const removeRedemptionReason = async (reason: string) => {
    if (!settings) return;
    const newReasons = settings.redemptionReasons.filter((r) => r !== reason);
    await updateSettings({ redemptionReasons: newReasons });
  };

  const addChoreReason = async (reason: string) => {
    if (!settings) return;
    const newReasons = [...settings.choreReasons, reason];
    await updateSettings({ choreReasons: newReasons });
  };

  const removeChoreReason = async (reason: string) => {
    if (!settings) return;
    const newReasons = settings.choreReasons.filter((r) => r !== reason);
    await updateSettings({ choreReasons: newReasons });
  };

  const addChild = async (childName: string, color?: string) => {
    if (!settings) return;
    const childId = childName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const newChildDoc = {
      id: childId,
      name: childName,
      createdAt: Timestamp.now(),
      color,
    };
    const newChildren = [...(settings.children || []).map(c => ({
      id: c.id,
      name: c.name,
      createdAt: Timestamp.fromDate(c.createdAt),
      color: c.color,
    })), newChildDoc];
    await updateSettings({ children: newChildren });
  };

  const removeChild = async (childId: string) => {
    if (!settings) return;
    const newChildren = settings.children
      .filter((c) => c.id !== childId)
      .map(c => ({
        id: c.id,
        name: c.name,
        createdAt: Timestamp.fromDate(c.createdAt),
        color: c.color,
      }));
    await updateSettings({ children: newChildren });
  };

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateSettings,
    addRewardReason,
    removeRewardReason,
    addRedemptionReason,
    removeRedemptionReason,
    addChoreReason,
    removeChoreReason,
    addChild,
    removeChild,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
