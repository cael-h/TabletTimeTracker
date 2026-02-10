import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  updateDoc,
  arrayUnion,
  deleteField,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FamilyGroup, FamilyGroupDoc, FamilyMember, FamilyMemberDoc, MemberRole, MemberStatus } from '../types';
import { useAuth } from './AuthContext';

// Generate a random 6-character alphanumeric code
const generateFamilyCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if a family code already exists
const checkFamilyCodeExists = async (code: string): Promise<boolean> => {
  const familyDoc = doc(db, `families/${code}`);
  const snapshot = await getDoc(familyDoc);
  return snapshot.exists();
};

// Generate a unique family code
const generateUniqueFamilyCode = async (): Promise<string> => {
  let code = generateFamilyCode();
  let exists = await checkFamilyCodeExists(code);

  while (exists) {
    code = generateFamilyCode();
    exists = await checkFamilyCodeExists(code);
  }

  return code;
};

interface FamilyContextType {
  family: FamilyGroup | null;
  loading: boolean;
  error: Error | null;
  createFamily: (familyName: string, role: MemberRole) => Promise<string>;
  joinFamily: (familyCode: string, role: MemberRole) => Promise<void>;
  updateMemberStatus: (memberId: string, status: MemberStatus) => Promise<void>;
  getCurrentMember: () => FamilyMember | null;
  isApprovedParent: () => boolean;
  getPendingParentRequests: () => FamilyMember[];
  shareInvite: () => Promise<void>;
  addManualMember: (name: string, email: string | undefined, role: MemberRole) => Promise<void>;
  findMatchingMember: (userName: string, userEmail: string | null) => FamilyMember | null;
  linkAuthToMember: (memberId: string, userName: string, userEmail: string | null) => Promise<string | null>;
  createMemberInCurrentFamily: (role: MemberRole) => Promise<void>;
  updateDisplayName: (memberId: string, displayName: string) => Promise<void>;
  updateMemberColor: (memberId: string, color: string) => Promise<void>;
  requestPermission: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within FamilyProvider');
  }
  return context;
};

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const migrationRanRef = useRef(false);

  // Helper function to create a Child record for tracking transactions
  const createChildRecord = async (familyId: string, name: string): Promise<string> => {
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

  // Helper function to ensure all members have childIds (migration for existing data)
  const ensureMembersHaveChildIds = async (familyId: string, members: { [userId: string]: FamilyMember }) => {
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

  // Helper function to ensure all child records have IDs (migration for existing data)
  const ensureChildRecordsHaveIds = async (familyId: string, members: { [userId: string]: FamilyMember }) => {
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

  useEffect(() => {
    if (!user) {
      setFamily(null);
      setLoading(false);
      return;
    }

    const findUserFamily = async () => {
      try {
        const userDoc = doc(db, `users/${user.uid}`);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists() && userSnapshot.data().familyId) {
          const familyId = userSnapshot.data().familyId;
          const familyDocRef = doc(db, `families/${familyId}`);

          const unsubscribe = onSnapshot(
            familyDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as FamilyGroupDoc;
                const members: { [userId: string]: FamilyMember } = {};

                Object.entries(data.members).forEach(([userId, memberDoc]) => {
                  members[userId] = {
                    id: userId,
                    displayName: memberDoc.displayName || memberDoc.name || 'Unknown',
                    emails: memberDoc.emails || (memberDoc.email ? [memberDoc.email] : []),
                    alternateNames: memberDoc.alternateNames || [],
                    role: memberDoc.role,
                    status: memberDoc.status,
                    joinedAt: memberDoc.joinedAt.toDate(),
                    approvedBy: memberDoc.approvedBy,
                    approvedAt: memberDoc.approvedAt?.toDate(),
                    requestedAt: memberDoc.requestedAt?.toDate(),
                    childId: memberDoc.childId,
                    isPreAdded: memberDoc.isPreAdded,
                    authUserId: memberDoc.authUserId,
                    color: memberDoc.color,
                  };
                });

                const familyData = {
                  id: snapshot.id,
                  name: data.name,
                  createdAt: data.createdAt.toDate(),
                  createdBy: data.createdBy,
                  members,
                };

                setFamily(familyData);

                // Ensure all members have childIds (migration) — run once per session
                if (!migrationRanRef.current) {
                  migrationRanRef.current = true;
                  ensureMembersHaveChildIds(snapshot.id, members).catch(console.error);
                  ensureChildRecordsHaveIds(snapshot.id, members).catch(console.error);
                }
              } else {
                setFamily(null);
              }
              setLoading(false);
              setError(null);
            },
            (err) => {
              console.error('Error fetching family:', err);
              setError(err as Error);
              setLoading(false);
            }
          );

          return unsubscribe;
        } else {
          setFamily(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error finding user family:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    const unsubscribePromise = findUserFamily();

    return () => {
      unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, [user]);

  const createFamily = async (familyName: string, role: MemberRole): Promise<string> => {
    if (!user) throw new Error('No authenticated user');

    const familyCode = await generateUniqueFamilyCode();
    const displayName = user.displayName || user.email || 'User';

    const childId = await createChildRecord(familyCode, displayName);

    const memberDoc: FamilyMemberDoc = {
      displayName: displayName,
      emails: user.email ? [user.email] : [],
      alternateNames: [],
      role,
      status: 'approved',
      joinedAt: Timestamp.now(),
      authUserId: user.uid,
      childId: childId,
    };

    const familyDocData: FamilyGroupDoc = {
      name: familyName,
      createdAt: Timestamp.now(),
      createdBy: user.uid,
      members: {
        [user.uid]: memberDoc,
      },
    };

    await setDoc(doc(db, `families/${familyCode}`), familyDocData);

    await setDoc(doc(db, `users/${user.uid}`), {
      familyId: familyCode,
    }, { merge: true });

    return familyCode;
  };

  const joinFamily = async (familyCode: string, role: MemberRole): Promise<void> => {
    if (!user) throw new Error('No authenticated user');

    const familyDocRef = doc(db, `families/${familyCode}`);
    const snapshot = await getDoc(familyDocRef);

    if (!snapshot.exists()) {
      throw new Error('Family code not found');
    }

    const familyData = snapshot.data() as FamilyGroupDoc;

    const existingMember = familyData.members[user.uid];
    if (existingMember && !existingMember.isPreAdded) {
      if (existingMember.status === 'approved') {
        throw new Error('You are already a member of this family');
      }
    }

    const displayName = user.displayName || user.email || 'User';

    // Check for pre-added member that matches this user
    const normalizedUserName = displayName.toLowerCase().trim();
    const normalizedUserEmail = user.email?.toLowerCase().trim();

    let preAddedMatch: { id: string; member: FamilyMemberDoc } | null = null;

    for (const [memberId, member] of Object.entries(familyData.members)) {
      if (!member.isPreAdded) continue;

      const displayNameMatch = member.displayName.toLowerCase().trim() === normalizedUserName;
      const alternateNameMatch = member.alternateNames?.some(
        name => name.toLowerCase().trim() === normalizedUserName
      );

      const emailMatch = normalizedUserEmail && member.emails.some(
        email => email.toLowerCase().trim() === normalizedUserEmail
      );

      if (displayNameMatch || alternateNameMatch || emailMatch) {
        preAddedMatch = { id: memberId, member };
        break;
      }
    }

    if (preAddedMatch) {
      if (existingMember && !existingMember.isPreAdded) {
        await updateDoc(familyDocRef, {
          [`members.${user.uid}`]: deleteField(),
        });
      }

      await setDoc(doc(db, `users/${user.uid}`), {
        familyId: familyCode,
      }, { merge: true });
      return;
    }

    // No pre-added match found
    if (existingMember && !existingMember.isPreAdded) {
      const updates: Record<string, any> = {
        [`members.${user.uid}.role`]: role,
        [`members.${user.uid}.status`]: role === 'parent' ? 'pending' : 'approved',
        [`members.${user.uid}.joinedAt`]: Timestamp.now(),
      };

      if (existingMember.status === 'rejected') {
        updates[`members.${user.uid}.approvedBy`] = deleteField();
        updates[`members.${user.uid}.approvedAt`] = deleteField();
      }

      await updateDoc(familyDocRef, updates);

      await setDoc(doc(db, `users/${user.uid}`), {
        familyId: familyCode,
      }, { merge: true });
      return;
    }

    // Create a new member record
    const childId = await createChildRecord(familyCode, displayName);

    const memberDoc: FamilyMemberDoc = {
      displayName: displayName,
      emails: user.email ? [user.email] : [],
      alternateNames: [],
      role,
      status: role === 'parent' ? 'pending' : 'approved',
      joinedAt: Timestamp.now(),
      authUserId: user.uid,
      childId: childId,
    };

    await updateDoc(familyDocRef, {
      [`members.${user.uid}`]: memberDoc,
    });

    await setDoc(doc(db, `users/${user.uid}`), {
      familyId: familyCode,
    }, { merge: true });
  };

  const updateMemberStatus = async (memberId: string, status: MemberStatus): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const currentMember = family.members[user.uid];
    if (!currentMember || currentMember.role !== 'parent' || currentMember.status !== 'approved') {
      throw new Error('Only approved parents can update member status');
    }

    const familyDocRef = doc(db, `families/${family.id}`);
    await updateDoc(familyDocRef, {
      [`members.${memberId}.status`]: status,
      [`members.${memberId}.approvedBy`]: user.uid,
      [`members.${memberId}.approvedAt`]: Timestamp.now(),
    });
  };

  const getCurrentMember = useCallback((): FamilyMember | null => {
    if (!user || !family) return null;
    return family.members[user.uid] || null;
  }, [user, family]);

  const isApprovedParent = useCallback((): boolean => {
    const member = getCurrentMember();
    return member?.role === 'parent' && member?.status === 'approved';
  }, [getCurrentMember]);

  const getPendingParentRequests = useCallback((): FamilyMember[] => {
    if (!family) return [];
    return Object.values(family.members).filter(
      m => m.role === 'parent' && m.status === 'pending'
    );
  }, [family]);

  // Generate invite link (internal helper)
  const getInviteLink = (): string => {
    if (!family) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?familyCode=${family.id}`;
  };

  const shareInvite = async (): Promise<void> => {
    if (!family) throw new Error('No family found');

    const inviteLink = getInviteLink();
    const shareData = {
      title: 'Join Our Family on Tablet Time Tracker',
      text: `Join our family "${family.name}" using code: ${family.id}`,
      url: inviteLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
    }
  };

  const addManualMember = async (name: string, email: string | undefined, role: MemberRole): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const currentMember = family.members[user.uid];
    if (!currentMember || currentMember.role !== 'parent' || currentMember.status !== 'approved') {
      throw new Error('Only approved parents can add family members');
    }

    const memberId = `pre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const childId = await createChildRecord(family.id, name);

    const memberDoc: FamilyMemberDoc = {
      displayName: name,
      emails: email ? [email] : [],
      alternateNames: [],
      role,
      status: 'approved',
      joinedAt: Timestamp.now(),
      isPreAdded: true,
      childId: childId,
    };

    const familyDocRef = doc(db, `families/${family.id}`);
    await updateDoc(familyDocRef, {
      [`members.${memberId}`]: memberDoc,
    });
  };

  const findMatchingMember = useCallback((userName: string, userEmail: string | null): FamilyMember | null => {
    if (!family) return null;

    const normalizedUserName = userName.toLowerCase().trim();
    const normalizedUserEmail = userEmail?.toLowerCase().trim();

    for (const member of Object.values(family.members)) {
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
  }, [family]);

  const linkAuthToMember = async (memberId: string, userName: string, userEmail: string | null): Promise<string | null> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const member = family.members[memberId];
    if (!member || !member.isPreAdded) {
      throw new Error('Invalid member to link');
    }

    const familyDocRef = doc(db, `families/${family.id}`);

    const newEmails = [...member.emails];
    const normalizedUserEmail = userEmail?.toLowerCase().trim();
    if (normalizedUserEmail && userEmail && !member.emails.some(e => e.toLowerCase().trim() === normalizedUserEmail)) {
      newEmails.push(userEmail);
    }

    const newAlternateNames = [...member.alternateNames];
    const normalizedUserName = userName.trim();
    if (
      normalizedUserName.toLowerCase() !== member.displayName.toLowerCase() &&
      !member.alternateNames.some(n => n.toLowerCase() === normalizedUserName.toLowerCase())
    ) {
      newAlternateNames.push(normalizedUserName);
    }

    const newMemberDoc: FamilyMemberDoc = {
      displayName: member.displayName,
      emails: newEmails,
      alternateNames: newAlternateNames,
      role: member.role,
      status: member.status,
      joinedAt: Timestamp.fromDate(member.joinedAt),
      authUserId: user.uid,
      isPreAdded: false,
      childId: member.childId,
      color: member.color,
    };

    if (member.approvedBy) {
      newMemberDoc.approvedBy = member.approvedBy;
    }
    if (member.approvedAt) {
      newMemberDoc.approvedAt = Timestamp.fromDate(member.approvedAt);
    }

    await updateDoc(familyDocRef, {
      [`members.${memberId}`]: deleteField(),
      [`members.${user.uid}`]: newMemberDoc,
    });

    await setDoc(doc(db, `users/${user.uid}`), {
      familyId: family.id,
    }, { merge: true });

    return member.childId || null;
  };

  const updateDisplayName = async (memberId: string, displayName: string): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const currentMember = family.members[user.uid];
    const isOwnProfile = memberId === user.uid;
    const isParent = currentMember?.role === 'parent' && currentMember?.status === 'approved';

    if (!isOwnProfile && !isParent) {
      throw new Error('You can only update your own display name');
    }

    const familyDocRef = doc(db, `families/${family.id}`);
    await updateDoc(familyDocRef, {
      [`members.${memberId}.displayName`]: displayName,
    });
  };

  const updateMemberColor = async (memberId: string, color: string): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const familyDocRef = doc(db, `families/${family.id}`);
    await updateDoc(familyDocRef, {
      [`members.${memberId}.color`]: color,
    });
  };

  const requestPermission = async (): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const currentMember = getCurrentMember();
    if (!currentMember) throw new Error('Member not found');
    if (currentMember.role !== 'parent') throw new Error('Only pending parents can request permission');
    if (currentMember.status === 'approved') throw new Error('You are already approved');

    const familyDocRef = doc(db, `families/${family.id}`);
    await updateDoc(familyDocRef, {
      [`members.${user.uid}.requestedAt`]: Timestamp.now(),
    });
  };

  const createMemberInCurrentFamily = async (role: MemberRole): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    if (family.members[user.uid]) {
      throw new Error('You already have a member record in this family');
    }

    const displayName = user.displayName || user.email || 'User';

    const childId = await createChildRecord(family.id, displayName);

    const memberDoc: FamilyMemberDoc = {
      displayName: displayName,
      emails: user.email ? [user.email] : [],
      alternateNames: [],
      role,
      status: role === 'parent' ? 'pending' : 'approved',
      joinedAt: Timestamp.now(),
      authUserId: user.uid,
      childId: childId,
    };

    const familyDocRef = doc(db, `families/${family.id}`);
    await updateDoc(familyDocRef, {
      [`members.${user.uid}`]: memberDoc,
    });
  };

  const value: FamilyContextType = {
    family,
    loading,
    error,
    createFamily,
    joinFamily,
    updateMemberStatus,
    getCurrentMember,
    isApprovedParent,
    getPendingParentRequests,
    shareInvite,
    addManualMember,
    findMatchingMember,
    linkAuthToMember,
    createMemberInCurrentFamily,
    updateDisplayName,
    updateMemberColor,
    requestPermission,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};
