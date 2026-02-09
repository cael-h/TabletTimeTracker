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
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction, TransactionInput, TransactionDoc, TransactionStatus } from '../types';
import { useAuth } from './useAuth';
import { useFamily } from './useFamily';

export const useTransactions = () => {
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
        const txns: Transaction[] = snapshot.docs.map((doc) => {
          const data = doc.data() as TransactionDoc;
          return {
            id: doc.id,
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

  // Get only approved transactions
  const approvedTransactions = transactions.filter((txn) => txn.status === 'approved');

  // Get pending transactions (for approval queue)
  const pendingTransactions = transactions.filter((txn) => txn.status === 'pending');

  // Calculate balance from approved transactions only
  const balance = approvedTransactions.reduce((sum, txn) => sum + txn.amount, 0);

  // Calculate balance for a specific child
  const getBalance = (childId: string) => {
    return approvedTransactions
      .filter((txn) => txn.childId === childId)
      .reduce((sum, txn) => sum + txn.amount, 0);
  };

  return {
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
};
