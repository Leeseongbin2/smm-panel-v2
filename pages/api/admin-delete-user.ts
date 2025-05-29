// pages/api/admin-delete-user.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert, getApps } from "firebase-admin/app";

// 🔧 환경 변수에서 가져온 서비스 계정 JSON 문자열 처리
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let serviceAccount: any = {};

if (serviceAccountRaw) {
  serviceAccount = JSON.parse(serviceAccountRaw);

  // 🔐 PEM 포맷 오류 방지를 위한 줄바꿈 처리
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "uid is required" });
  }

  try {
    await getAuth().deleteUser(uid);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      console.warn("⚠️ 사용자 계정이 이미 존재하지 않습니다. Firestore에서만 삭제합니다.");
      return res.status(200).json({ message: "User not found in Auth, assumed deleted." });
    }
    console.error("Firebase Admin Delete Error:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
}