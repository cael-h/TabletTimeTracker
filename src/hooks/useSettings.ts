import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Settings, SettingsDoc, Child, ChildDoc } from '../types';
import { useAuth } from './useAuth';

const DEFAULT_REWARD_REASONS = [
  'Brushed Teeth',
  'Cleaned Room',
  'Ate Dinner',
  'Homework',
  'Helped Sister',
];

const DEFAULT_REDEMPTION_REASONS = ['Tablet', 'TV', 'Switch'];

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const settingsDoc = doc(db, `users/${user.uid}/settings/config`);

    // Initialize settings if they don't exist
    const initializeSettings = async () => {
      const docSnap = await getDoc(settingsDoc);
      if (!docSnap.exists()) {
        const defaultSettings: SettingsDoc = {
          rewardReasons: DEFAULT_REWARD_REASONS,
          redemptionReasons: DEFAULT_REDEMPTION_REASONS,
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
          const children: Child[] = (data.children || []).map((childDoc) => ({
            id: childDoc.name.toLowerCase().replace(/\s+/g, '-'),
            name: childDoc.name,
            createdAt: childDoc.createdAt.toDate(),
          }));
          setSettings({
            id: snapshot.id,
            rewardReasons: data.rewardReasons,
            redemptionReasons: data.redemptionReasons,
            children,
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
  }, [user]);

  const updateSettings = async (updates: Partial<SettingsDoc>) => {
    if (!user) throw new Error('No authenticated user');

    const settingsDoc = doc(db, `users/${user.uid}/settings/config`);
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

  const addChild = async (childName: string) => {
    if (!settings) return;
    const newChildDoc: ChildDoc = {
      name: childName,
      createdAt: Timestamp.now(),
    };
    const newChildren = [...(settings.children || []).map(c => ({
      name: c.name,
      createdAt: Timestamp.fromDate(c.createdAt),
    })), newChildDoc];
    await updateSettings({ children: newChildren });
  };

  const removeChild = async (childId: string) => {
    if (!settings) return;
    const newChildren = settings.children
      .filter((c) => c.id !== childId)
      .map(c => ({
        name: c.name,
        createdAt: Timestamp.fromDate(c.createdAt),
      }));
    await updateSettings({ children: newChildren });
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    addRewardReason,
    removeRewardReason,
    addRedemptionReason,
    removeRedemptionReason,
    addChild,
    removeChild,
  };
};
