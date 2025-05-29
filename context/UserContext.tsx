import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebaseClient";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface UserContextType {
  user: User | null;
  userPoints: number | null;
  userEmail: string | null;
  isLoading: boolean;
  setUserPoints: (points: number) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  userPoints: null,
  userEmail: null,
  isLoading: true,
  setUserPoints: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setUserEmail(firebaseUser.email || null);

        const db = getFirestore();
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserPoints(userSnap.data().points || 0);
        }
      } else {
        setUser(null);
        setUserEmail(null);
        setUserPoints(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        userPoints,
        userEmail,
        isLoading,
        setUserPoints,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);