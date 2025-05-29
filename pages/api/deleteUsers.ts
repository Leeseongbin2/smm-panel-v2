// pages/api/delete-user.ts
import { NextApiRequest, NextApiResponse } from "next";
import admin from "firebase-admin";

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
    ),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "허용되지 않은 메서드입니다." });
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ message: "UID가 누락되었습니다." });
  }

  try {
    await admin.auth().deleteUser(uid);
    return res.status(200).json({ message: "✅ Firebase Auth 사용자 삭제 완료" });
  } catch (error: any) {
    return res.status(500).json({ message: "❌ 사용자 삭제 실패", error: error.message });
  }
}
