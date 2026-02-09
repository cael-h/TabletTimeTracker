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
import { useFamily } from './useFamily';

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

export const useSettings = () => {
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
          const children: Child[] = (data.children || []).map((childDoc: ChildDoc & { id?: string }) => ({
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
    // Generate a unique ID for the new child
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

  return {
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
};
