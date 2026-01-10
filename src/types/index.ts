// Transaction types
export type TransactionCategory = 'Reward' | 'Redemption' | 'Adjustment';

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number; // positive = earned, negative = spent
  reason: string;
  category: TransactionCategory;
  user: string; // Person who logged it (Mom, Dad, or custom name)
  childId: string; // Which child this transaction is for
}

export interface TransactionInput {
  timestamp?: Date;
  amount: number;
  reason: string;
  category: TransactionCategory;
  user: string;
  childId: string;
}

// Child types
export interface Child {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ChildDoc {
  name: string;
  createdAt: any; // Firestore Timestamp
}

// Settings types
export interface Settings {
  id: string;
  rewardReasons: string[];
  redemptionReasons: string[];
  children: Child[];
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
  childId: string;
}

export interface SettingsDoc {
  rewardReasons: string[];
  redemptionReasons: string[];
  children: ChildDoc[];
}
