import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction, TransactionInput, TransactionDoc } from '../types';
import { useAuth } from './useAuth';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/transactions`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txns: Transaction[] = snapshot.docs.map((doc) => {
          const data = doc.data() as TransactionDoc;
          return {
            id: doc.id,
            timestamp: data.timestamp.toDate(),
            amount: data.amount,
            reason: data.reason,
            category: data.category,
            user: data.user,
            childId: data.childId || 'default', // Fallback for old transactions
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
  }, [user]);

  const addTransaction = async (transaction: TransactionInput) => {
    if (!user) throw new Error('No authenticated user');

    const docData: TransactionDoc = {
      timestamp: transaction.timestamp
        ? Timestamp.fromDate(transaction.timestamp)
        : Timestamp.now(),
      amount: transaction.amount,
      reason: transaction.reason,
      category: transaction.category,
      user: transaction.user,
      childId: transaction.childId,
    };

    await addDoc(collection(db, `users/${user.uid}/transactions`), docData);
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) throw new Error('No authenticated user');
    await deleteDoc(doc(db, `users/${user.uid}/transactions`, transactionId));
  };

  const balance = transactions.reduce((sum, txn) => sum + txn.amount, 0);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    balance,
  };
};
