// Transaction types
export type TransactionCategory = 'Reward' | 'Redemption' | 'Adjustment';

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number; // positive = earned, negative = spent
  reason: string;
  category: TransactionCategory;
  user: 'Mom' | 'Dad';
}

export interface TransactionInput {
  timestamp?: Date;
  amount: number;
  reason: string;
  category: TransactionCategory;
  user: 'Mom' | 'Dad';
}

// Settings types
export interface Settings {
  id: string;
  rewardReasons: string[];
  redemptionReasons: string[];
}

// User identity
export type UserIdentity = 'Mom' | 'Dad';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Firestore document types (with Timestamp instead of Date)
export interface TransactionDoc {
  timestamp: any; // Firestore Timestamp
  amount: number;
  reason: string;
  category: TransactionCategory;
  user: UserIdentity;
}

export interface SettingsDoc {
  rewardReasons: string[];
  redemptionReasons: string[];
}
