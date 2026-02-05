import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function SubscriptionSuccess() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    addDoc(collection(db, 'pro_requests'), {
      userId: user.uid,
      email: user.email,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }, [user]);

  return (
    <div className="p-10 text-center">
      <h2 className="text-2xl font-bold text-green-600">
        ✅ Payment received
      </h2>
      <p className="mt-2">
        Your PRO request has been sent.  
        You will be activated shortly.
      </p>
    </div>
  );
}
