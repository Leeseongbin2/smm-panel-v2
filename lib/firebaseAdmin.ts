// lib/firebase.ts
// lib/firebase.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = admin.firestore();   // Firestore DB 인스턴스
const adminAuth = admin.auth();      // Firebase 인증 인스턴스

export { admin, adminDb, adminAuth };