import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useAuth } from './useAuth';

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

  // Keep trying until we find a unique code (very unlikely to need more than 1 try)
  while (exists) {
    code = generateFamilyCode();
    exists = await checkFamilyCodeExists(code);
  }

  return code;
};

export const useFamily = () => {
  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const migrationRanRef = useRef(false);

  // Helper function to create a Child record for tracking transactions
  const createChildRecord = async (familyId: string, name: string): Promise<string> => {
    const childId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const settingsDoc = doc(db, `families/${familyId}/settings/config`);

    // Get current settings or create default
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
      // Add child to existing array
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

    // Check if any children are missing IDs
    const needsUpdate = children.some((child: any) => !child.id);
    if (!needsUpdate) return;

    // Create a map of childId to member displayName
    const childIdToName = new Map<string, string>();
    for (const member of Object.values(members)) {
      if (member.childId) {
        childIdToName.set(member.childId, member.displayName);
      }
    }

    // Update children to add missing IDs
    const updatedChildren = children.map((child: any) => {
      // If child already has an ID, keep it as is
      if (child.id) return child;

      // Find the matching childId by name
      for (const [childId, name] of childIdToName.entries()) {
        if (child.name === name) {
          return {
            ...child,
            id: childId,
          };
        }
      }

      // If no match found, generate a new ID
      const newChildId = child.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      return {
        ...child,
        id: newChildId,
      };
    });

    // Update the settings document with the fixed children array
    await updateDoc(settingsDoc, {
      children: updatedChildren,
    });
  };

  useEffect(() => {
    if (!user) {
      setFamily(null);
      setLoading(false);
      return;
    }

    // First, find which family this user belongs to
    const findUserFamily = async () => {
      try {
        // Check user's familyId in their user document
        const userDoc = doc(db, `users/${user.uid}`);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists() && userSnapshot.data().familyId) {
          const familyId = userSnapshot.data().familyId;
          const familyDoc = doc(db, `families/${familyId}`);

          // Subscribe to family changes
          const unsubscribe = onSnapshot(
            familyDoc,
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

                // Ensure all members have childIds (migration for existing data) — run once per session
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

  // Create a new family group
  const createFamily = async (familyName: string, role: MemberRole): Promise<string> => {
    if (!user) throw new Error('No authenticated user');

    const familyCode = await generateUniqueFamilyCode();
    const displayName = user.displayName || user.email || 'User';

    // Create a child record for transaction tracking
    const childId = await createChildRecord(familyCode, displayName);

    const memberDoc: FamilyMemberDoc = {
      displayName: displayName,
      emails: user.email ? [user.email] : [],
      alternateNames: [],
      role,
      status: 'approved', // Creator is auto-approved
      joinedAt: Timestamp.now(),
      authUserId: user.uid,
      childId: childId,
    };

    const familyDoc: FamilyGroupDoc = {
      name: familyName,
      createdAt: Timestamp.now(),
      createdBy: user.uid,
      members: {
        [user.uid]: memberDoc,
      },
    };

    // Create family document
    await setDoc(doc(db, `families/${familyCode}`), familyDoc);

    // Update user document with family ID
    await setDoc(doc(db, `users/${user.uid}`), {
      familyId: familyCode,
    }, { merge: true });

    return familyCode;
  };

  // Join an existing family group
  const joinFamily = async (familyCode: string, role: MemberRole): Promise<void> => {
    if (!user) throw new Error('No authenticated user');

    const familyDocRef = doc(db, `families/${familyCode}`);
    const snapshot = await getDoc(familyDocRef);

    if (!snapshot.exists()) {
      throw new Error('Family code not found');
    }

    const familyData = snapshot.data() as FamilyGroupDoc;

    // Check if user already has an authenticated (non-pre-added) member record
    const existingMember = familyData.members[user.uid];
    if (existingMember && !existingMember.isPreAdded) {
      // User already has a member record - check status
      if (existingMember.status === 'approved') {
        throw new Error('You are already a member of this family');
      }
      // Status is 'pending' or 'rejected' - allow re-joining
      // They can try again with a different role or wait for approval
    }

    const displayName = user.displayName || user.email || 'User';

    // Check for pre-added member that matches this user
    const normalizedUserName = displayName.toLowerCase().trim();
    const normalizedUserEmail = user.email?.toLowerCase().trim();

    let preAddedMatch: { id: string; member: FamilyMemberDoc } | null = null;

    for (const [memberId, member] of Object.entries(familyData.members)) {
      // Skip if this member is already authenticated
      if (!member.isPreAdded) continue;

      // Check if name matches
      const displayNameMatch = member.displayName.toLowerCase().trim() === normalizedUserName;
      const alternateNameMatch = member.alternateNames?.some(
        name => name.toLowerCase().trim() === normalizedUserName
      );

      // Check if email matches
      const emailMatch = normalizedUserEmail && member.emails.some(
        email => email.toLowerCase().trim() === normalizedUserEmail
      );

      if (displayNameMatch || alternateNameMatch || emailMatch) {
        preAddedMatch = { id: memberId, member };
        break;
      }
    }

    // If we found a pre-added match, handle existing member cleanup
    // and let MemberMatchPage handle the linking
    if (preAddedMatch) {
      // Remove the old pending/rejected member if it exists (they'll link to pre-added instead)
      if (existingMember && !existingMember.isPreAdded) {
        await updateDoc(familyDocRef, {
          [`members.${user.uid}`]: deleteField(),
        });
      }

      // Just update the user document - MemberMatchPage will handle the rest
      await setDoc(doc(db, `users/${user.uid}`), {
        familyId: familyCode,
      }, { merge: true });
      return;
    }

    // No pre-added match found
    // If they have a pending/rejected member record, update it with the new role
    if (existingMember && !existingMember.isPreAdded) {
      // Clear rejection and update role - gives user a fresh start
      const updates: Record<string, any> = {
        [`members.${user.uid}.role`]: role,
        [`members.${user.uid}.status`]: role === 'parent' ? 'pending' : 'approved',
        [`members.${user.uid}.joinedAt`]: Timestamp.now(),
      };

      // Clear previous approval/rejection data for a fresh start
      if (existingMember.status === 'rejected') {
        updates[`members.${user.uid}.approvedBy`] = deleteField();
        updates[`members.${user.uid}.approvedAt`] = deleteField();
      }

      await updateDoc(familyDocRef, updates);

      // Ensure user document has family ID
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
      status: role === 'parent' ? 'pending' : 'approved', // Parents need approval, kids are auto-approved
      joinedAt: Timestamp.now(),
      authUserId: user.uid,
      childId: childId,
    };

    // Add member to family
    await updateDoc(familyDocRef, {
      [`members.${user.uid}`]: memberDoc,
    });

    // Update user document with family ID
    await setDoc(doc(db, `users/${user.uid}`), {
      familyId: familyCode,
    }, { merge: true });
  };

  // Approve or reject a member request
  const updateMemberStatus = async (memberId: string, status: MemberStatus): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    // Check if current user is an approved parent
    const currentMember = family.members[user.uid];
    if (!currentMember || currentMember.role !== 'parent' || currentMember.status !== 'approved') {
      throw new Error('Only approved parents can update member status');
    }

    const familyDoc = doc(db, `families/${family.id}`);
    await updateDoc(familyDoc, {
      [`members.${memberId}.status`]: status,
      [`members.${memberId}.approvedBy`]: user.uid,
      [`members.${memberId}.approvedAt`]: Timestamp.now(),
    });
  };

  // Update member's child ID (link a kid to a child profile)
  const linkMemberToChild = async (memberId: string, childId: string): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    // Check if current user is an approved parent
    const currentMember = family.members[user.uid];
    if (!currentMember || currentMember.role !== 'parent' || currentMember.status !== 'approved') {
      throw new Error('Only approved parents can link members to children');
    }

    const familyDoc = doc(db, `families/${family.id}`);
    await updateDoc(familyDoc, {
      [`members.${memberId}.childId`]: childId,
    });
  };

  // Get current user's member info
  const getCurrentMember = (): FamilyMember | null => {
    if (!user || !family) return null;
    return family.members[user.uid] || null;
  };

  // Check if current user is an approved parent
  const isApprovedParent = (): boolean => {
    const member = getCurrentMember();
    return member?.role === 'parent' && member?.status === 'approved';
  };

  // Get all approved parents
  const getApprovedParents = (): FamilyMember[] => {
    if (!family) return [];
    return Object.values(family.members).filter(
      m => m.role === 'parent' && m.status === 'approved'
    );
  };

  // Get all pending parent requests
  const getPendingParentRequests = (): FamilyMember[] => {
    if (!family) return [];
    return Object.values(family.members).filter(
      m => m.role === 'parent' && m.status === 'pending'
    );
  };

  // Generate invite link
  const getInviteLink = (): string => {
    if (!family) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?familyCode=${family.id}`;
  };

  // Share invite using Web Share API
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
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
    }
  };

  // Manually add a family member (before they authenticate)
  const addManualMember = async (name: string, email: string | undefined, role: MemberRole): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    // Check if current user is an approved parent
    const currentMember = family.members[user.uid];
    if (!currentMember || currentMember.role !== 'parent' || currentMember.status !== 'approved') {
      throw new Error('Only approved parents can add family members');
    }

    // Generate a unique ID for the pre-added member
    const memberId = `pre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a child record for transaction tracking
    const childId = await createChildRecord(family.id, name);

    const memberDoc: FamilyMemberDoc = {
      displayName: name,
      emails: email ? [email] : [],
      alternateNames: [],
      role,
      status: 'approved', // Pre-added members are auto-approved
      joinedAt: Timestamp.now(),
      isPreAdded: true,
      childId: childId,
    };

    const familyDoc = doc(db, `families/${family.id}`);
    await updateDoc(familyDoc, {
      [`members.${memberId}`]: memberDoc,
    });
  };

  // Find a matching member by name or email (memoized to prevent unnecessary re-renders)
  const findMatchingMember = useCallback((userName: string, userEmail: string | null): FamilyMember | null => {
    if (!family) return null;

    const normalizedUserName = userName.toLowerCase().trim();
    const normalizedUserEmail = userEmail?.toLowerCase().trim();

    for (const member of Object.values(family.members)) {
      // Skip if this member is already authenticated
      if (!member.isPreAdded) continue;

      // Check if name matches
      const displayNameMatch = member.displayName.toLowerCase().trim() === normalizedUserName;
      const alternateNameMatch = member.alternateNames.some(
        name => name.toLowerCase().trim() === normalizedUserName
      );

      // Check if email matches
      const emailMatch = normalizedUserEmail && member.emails.some(
        email => email.toLowerCase().trim() === normalizedUserEmail
      );

      if (displayNameMatch || alternateNameMatch || emailMatch) {
        return member;
      }
    }

    return null;
  }, [family]);

  // Link an authenticated user to a pre-added member
  const linkAuthToMember = async (memberId: string, userName: string, userEmail: string | null): Promise<string | null> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const member = family.members[memberId];
    if (!member || !member.isPreAdded) {
      throw new Error('Invalid member to link');
    }

    const familyDocRef = doc(db, `families/${family.id}`);

    // Build the new member data, moving it to user.uid as the key
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

    // Copy over optional fields if they exist
    if (member.approvedBy) {
      newMemberDoc.approvedBy = member.approvedBy;
    }
    if (member.approvedAt) {
      newMemberDoc.approvedAt = Timestamp.fromDate(member.approvedAt);
    }

    // Delete old pre-added member and create new one under user.uid
    await updateDoc(familyDocRef, {
      [`members.${memberId}`]: deleteField(),
      [`members.${user.uid}`]: newMemberDoc,
    });

    // Update user document with family ID
    await setDoc(doc(db, `users/${user.uid}`), {
      familyId: family.id,
    }, { merge: true });

    // Return the childId so the caller can set it as activeChildId
    return member.childId || null;
  };

  // Update a member's display name
  const updateDisplayName = async (memberId: string, displayName: string): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    // Check if current user is updating their own name or is an approved parent
    const currentMember = family.members[user.uid];
    const isOwnProfile = memberId === user.uid;
    const isApprovedParent = currentMember?.role === 'parent' && currentMember?.status === 'approved';

    if (!isOwnProfile && !isApprovedParent) {
      throw new Error('You can only update your own display name');
    }

    const familyDoc = doc(db, `families/${family.id}`);
    await updateDoc(familyDoc, {
      [`members.${memberId}.displayName`]: displayName,
    });
  };

  // Update a member's color
  const updateMemberColor = async (memberId: string, color: string): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const familyDoc = doc(db, `families/${family.id}`);
    await updateDoc(familyDoc, {
      [`members.${memberId}.color`]: color,
    });
  };

  // Request permission to join as a parent (updates requestedAt timestamp)
  const requestPermission = async (): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const currentMember = getCurrentMember();
    if (!currentMember) throw new Error('Member not found');
    if (currentMember.role !== 'parent') throw new Error('Only pending parents can request permission');
    if (currentMember.status === 'approved') throw new Error('You are already approved');

    const familyDoc = doc(db, `families/${family.id}`);
    await updateDoc(familyDoc, {
      [`members.${user.uid}.requestedAt`]: Timestamp.now(),
    });
  };

  // Create a new member in the current family (used when user denies a pre-added match)
  const createMemberInCurrentFamily = async (role: MemberRole): Promise<void> => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    // Check if user already has a member record
    if (family.members[user.uid]) {
      throw new Error('You already have a member record in this family');
    }

    const displayName = user.displayName || user.email || 'User';

    // Create a child record for transaction tracking
    const childId = await createChildRecord(family.id, displayName);

    const memberDoc: FamilyMemberDoc = {
      displayName: displayName,
      emails: user.email ? [user.email] : [],
      alternateNames: [],
      role,
      status: role === 'parent' ? 'pending' : 'approved', // Parents need approval, kids are auto-approved
      joinedAt: Timestamp.now(),
      authUserId: user.uid,
      childId: childId,
    };

    const familyDoc = doc(db, `families/${family.id}`);
    await updateDoc(familyDoc, {
      [`members.${user.uid}`]: memberDoc,
    });
  };

  return {
    family,
    loading,
    error,
    createFamily,
    joinFamily,
    updateMemberStatus,
    linkMemberToChild,
    getCurrentMember,
    isApprovedParent,
    getApprovedParents,
    getPendingParentRequests,
    getInviteLink,
    shareInvite,
    addManualMember,
    findMatchingMember,
    linkAuthToMember,
    createMemberInCurrentFamily,
    updateDisplayName,
    updateMemberColor,
    requestPermission,
  };
};
