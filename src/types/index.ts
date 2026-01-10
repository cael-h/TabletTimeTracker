// Transaction types
export type TransactionCategory = 'Reward' | 'Redemption' | 'Adjustment' | 'Chore';
export type TransactionUnit = 'minutes' | 'points';

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number; // positive = earned, negative = spent
  reason: string;
  category: TransactionCategory;
  user: string; // Person who logged it (Mom, Dad, or custom name)
  childId: string; // Which child/person this transaction is for
  unit: TransactionUnit; // What type of value - minutes for kids, points for adults
}

export interface TransactionInput {
  timestamp?: Date;
  amount: number;
  reason: string;
  category: TransactionCategory;
  user: string;
  childId: string;
  unit: TransactionUnit;
}

// Child types (can represent kids or adults)
export interface Child {
  id: string;
  name: string;
  createdAt: Date;
  color?: string; // Hex color code for display
}

export interface ChildDoc {
  name: string;
  createdAt: any; // Firestore Timestamp
  color?: string;
}

// Settings types
export interface Settings {
  id: string;
  rewardReasons: string[];
  redemptionReasons: string[];
  choreReasons: string[];
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
  unit: TransactionUnit;
}

export interface SettingsDoc {
  rewardReasons: string[];
  redemptionReasons: string[];
  choreReasons: string[];
  children: ChildDoc[];
}
