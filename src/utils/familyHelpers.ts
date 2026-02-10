import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FamilyMember } from '../types';

/** Generate a random 6-character alphanumeric code. */
export const generateFamilyCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/** Check if a family code already exists. */
export const checkFamilyCodeExists = async (code: string): Promise<boolean> => {
  const familyDoc = doc(db, `families/${code}`);
  const snapshot = await getDoc(familyDoc);
  return snapshot.exists();
};

/** Generate a unique family code (retries until unique). */
export const generateUniqueFamilyCode = async (): Promise<string> => {
  let code = generateFamilyCode();
  let exists = await checkFamilyCodeExists(code);
  while (exists) {
    code = generateFamilyCode();
    exists = await checkFamilyCodeExists(code);
  }
  return code;
};

/** Create a child record in the settings doc for transaction tracking. */
export const createChildRecord = async (familyId: string, name: string): Promise<string> => {
  const childId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  const settingsDoc = doc(db, `families/${familyId}/settings/config`);

  const settingsSnap = await getDoc(settingsDoc);
  if (!settingsSnap.exists()) {
    await setDoc(settingsDoc, {
      rewardReasons: [],
      redemptionReasons: [],
      choreReasons: [],
      children: [{
        id: childId,
        name: name,
        createdAt: Timestamp.now(),
        color: '#6b7280',
      }]
    });
  } else {
    await updateDoc(settingsDoc, {
      children: arrayUnion({
        id: childId,
        name: name,
        createdAt: Timestamp.now(),
        color: '#6b7280',
      })
    });
  }

  return childId;
};

/**
 * Match a user by name/email against pre-added family members.
 * Returns the matched member or null.
 */
export const matchMemberByNameOrEmail = (
  members: { [id: string]: FamilyMember },
  userName: string,
  userEmail: string | null,
): FamilyMember | null => {
  const normalizedUserName = userName.toLowerCase().trim();
  const normalizedUserEmail = userEmail?.toLowerCase().trim();

  for (const member of Object.values(members)) {
    if (!member.isPreAdded) continue;

    const displayNameMatch = member.displayName.toLowerCase().trim() === normalizedUserName;
    const alternateNameMatch = member.alternateNames.some(
      name => name.toLowerCase().trim() === normalizedUserName
    );
    const emailMatch = normalizedUserEmail && member.emails.some(
      email => email.toLowerCase().trim() === normalizedUserEmail
    );

    if (displayNameMatch || alternateNameMatch || emailMatch) {
      return member;
    }
  }

  return null;
};

/** Ensure all members have childIds (migration for existing data). */
export const ensureMembersHaveChildIds = async (
  familyId: string,
  members: { [userId: string]: FamilyMember },
) => {
  const updates: { [key: string]: string } = {};
  let needsUpdate = false;

  for (const [memberId, member] of Object.entries(members)) {
    if (!member.childId) {
      needsUpdate = true;
      const childId = await createChildRecord(familyId, member.displayName);
      updates[`members.${memberId}.childId`] = childId;
    }
  }

  if (needsUpdate) {
    const familyDoc = doc(db, `families/${familyId}`);
    await updateDoc(familyDoc, updates);
  }
};

/** Ensure all child records have IDs (migration for existing data). */
export const ensureChildRecordsHaveIds = async (
  familyId: string,
  members: { [userId: string]: FamilyMember },
) => {
  const settingsDoc = doc(db, `families/${familyId}/settings/config`);
  const settingsSnap = await getDoc(settingsDoc);

  if (!settingsSnap.exists()) return;

  const settings = settingsSnap.data();
  const children = settings.children || [];

  const needsUpdate = children.some((child: any) => !child.id);
  if (!needsUpdate) return;

  const childIdToName = new Map<string, string>();
  for (const member of Object.values(members)) {
    if (member.childId) {
      childIdToName.set(member.childId, member.displayName);
    }
  }

  const updatedChildren = children.map((child: any) => {
    if (child.id) return child;

    for (const [childId, name] of childIdToName.entries()) {
      if (child.name === name) {
        return { ...child, id: childId };
      }
    }

    const newChildId = child.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    return { ...child, id: newChildId };
  });

  await updateDoc(settingsDoc, { children: updatedChildren });
};
