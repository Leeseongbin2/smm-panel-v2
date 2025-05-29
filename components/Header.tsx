// components/Header.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "../lib/firebaseAdmin";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Header = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/"); // 로그아웃 후 메인으로 이동
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        background: "#f9f9f9",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "1.2rem" }}>에이치앤비</h1>
    </header>
  );
};

export default Header;