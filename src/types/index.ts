// Transaction types
export type TransactionCategory = 'Reward' | 'Redemption' | 'Adjustment' | 'Chore';
export type TransactionUnit = 'minutes' | 'points';
export type TransactionStatus = 'approved' | 'pending' | 'rejected';

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number; // positive = earned, negative = spent
  reason: string;
  category: TransactionCategory;
  user: string; // Person who logged it (Mom, Dad, or custom name)
  userId: string; // Firebase Auth user ID of the person who logged it
  childId: string; // Which child/person this transaction is for
  unit: TransactionUnit; // What type of value - minutes for kids, points for adults
  status: TransactionStatus; // Approval status
  approvedBy?: string; // userId of parent who approved/rejected
  approvedAt?: Date; // When it was approved/rejected
}

export interface TransactionInput {
  timestamp?: Date;
  amount: number;
  reason: string;
  category: TransactionCategory;
  user: string;
  userId: string;
  childId: string;
  unit: TransactionUnit;
  status?: TransactionStatus;
}

// Child types (can represent kids or adults)
export interface Child {
  id: string;
  name: string;
  createdAt: Date;
  color?: string; // Hex color code for display
  email?: string; // Optional email for linking auth account
}

export interface ChildDoc {
  name: string;
  createdAt: any; // Firestore Timestamp
  color?: string;
  email?: string;
}

// Family and Member types
export type MemberRole = 'parent' | 'kid';
export type MemberStatus = 'approved' | 'pending' | 'rejected';

export interface FamilyMember {
  id: string; // Firebase Auth user ID (or generated ID for pre-added members)
  displayName: string; // The name to display in the app
  emails: string[]; // Array of emails associated with this member
  alternateNames: string[]; // Array of alternate names for this member
  role: MemberRole;
  status: MemberStatus;
  joinedAt: Date;
  approvedBy?: string; // userId of parent who approved (for parent requests)
  approvedAt?: Date;
  childId?: string; // If role is 'kid', links to Child record
  isPreAdded?: boolean; // Whether this member was manually added before authentication
  authUserId?: string; // The actual Firebase Auth user ID (only set after authentication)
}

export interface FamilyMemberDoc {
  displayName: string;
  emails: string[];
  alternateNames: string[];
  role: MemberRole;
  status: MemberStatus;
  joinedAt: any; // Firestore Timestamp
  approvedBy?: string;
  approvedAt?: any; // Firestore Timestamp
  childId?: string;
  isPreAdded?: boolean;
  authUserId?: string;
  // Backward compatibility - these may exist in old documents
  name?: string;
  email?: string;
}

export interface FamilyGroup {
  id: string; // Family code (6-character alphanumeric)
  name: string; // Optional family name
  createdAt: Date;
  createdBy: string; // userId of creator
  members: { [userId: string]: FamilyMember }; // Map of userId to member info
}

export interface FamilyGroupDoc {
  name: string;
  createdAt: any; // Firestore Timestamp
  createdBy: string;
  members: { [userId: string]: FamilyMemberDoc };
}

// Settings types
export interface Settings {
  id: string;
  rewardReasons: string[];
  redemptionReasons: string[];
  choreReasons: string[];
  children: Child[];
}

// Personal settings (stored per user, not synced)
export interface PersonalSettings {
  childColors: { [childId: string]: string }; // Personal color preferences for each child
  theme: ThemeMode;
}

export interface PersonalSettingsDoc {
  childColors: { [childId: string]: string };
  theme: ThemeMode;
}

// User identity - can be Mom, Dad, or custom name
export type UserIdentity = string;

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Firestore document types (with Timestamp instead of Date)
export interface TransactionDoc {
  timestamp: any; // Firestore Timestamp
  amount: number;
  reason: string;
  category: TransactionCategory;
  user: string;
  userId: string;
  childId: string;
  unit: TransactionUnit;
  status: TransactionStatus;
  approvedBy?: string;
  approvedAt?: any; // Firestore Timestamp
}

export interface SettingsDoc {
  rewardReasons: string[];
  redemptionReasons: string[];
  choreReasons: string[];
  children: ChildDoc[];
}
