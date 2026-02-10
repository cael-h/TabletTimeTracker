import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction, TransactionInput, TransactionDoc, TransactionStatus } from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';

interface TransactionsContextType {
  transactions: Transaction[];
  approvedTransactions: Transaction[];
  pendingTransactions: Transaction[];
  loading: boolean;
  error: Error | null;
  addTransaction: (transaction: TransactionInput) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  updateTransactionStatus: (transactionId: string, status: TransactionStatus) => Promise<void>;
  balance: number;
  getBalance: (childId: string) => number;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionsProvider');
  }
  return context;
};

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { family } = useFamily();

  useEffect(() => {
    if (!user || !family) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `families/${family.id}/transactions`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txns: Transaction[] = snapshot.docs.map((d) => {
          const data = d.data() as TransactionDoc;
          return {
            id: d.id,
            timestamp: data.timestamp.toDate(),
            amount: data.amount,
            reason: data.reason,
            category: data.category,
            user: data.user,
            userId: data.userId || '',
            childId: data.childId || 'default',
            unit: data.unit || 'minutes',
            status: data.status || 'approved',
            approvedBy: data.approvedBy,
            approvedAt: data.approvedAt?.toDate(),
          };
        });
        setTransactions(txns);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, family]);

  const addTransaction = async (transaction: TransactionInput) => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const docData: TransactionDoc = {
      timestamp: transaction.timestamp
        ? Timestamp.fromDate(transaction.timestamp)
        : Timestamp.now(),
      amount: transaction.amount,
      reason: transaction.reason,
      category: transaction.category,
      user: transaction.user,
      userId: transaction.userId,
      childId: transaction.childId,
      unit: transaction.unit,
      status: transaction.status || 'approved',
    };

    await addDoc(collection(db, `families/${family.id}/transactions`), docData);
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');
    await deleteDoc(doc(db, `families/${family.id}/transactions`, transactionId));
  };

  const updateTransactionStatus = async (
    transactionId: string,
    status: TransactionStatus
  ) => {
    if (!user) throw new Error('No authenticated user');
    if (!family) throw new Error('No family found');

    const transactionDoc = doc(db, `families/${family.id}/transactions`, transactionId);
    await updateDoc(transactionDoc, {
      status,
      approvedBy: user.uid,
      approvedAt: Timestamp.now(),
    });
  };

  const approvedTransactions = useMemo(
    () => transactions.filter((txn) => txn.status === 'approved'),
    [transactions]
  );

  const pendingTransactions = useMemo(
    () => transactions.filter((txn) => txn.status === 'pending'),
    [transactions]
  );

  const balance = useMemo(
    () => approvedTransactions.reduce((sum, txn) => sum + txn.amount, 0),
    [approvedTransactions]
  );

  const getBalance = useCallback(
    (childId: string) => {
      return approvedTransactions
        .filter((txn) => txn.childId === childId)
        .reduce((sum, txn) => sum + txn.amount, 0);
    },
    [approvedTransactions]
  );

  const value: TransactionsContextType = {
    transactions,
    approvedTransactions,
    pendingTransactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    updateTransactionStatus,
    balance,
    getBalance,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};
