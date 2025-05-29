import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

admin.initializeApp();
const db = admin.firestore();

const SMMKINGS_API_URL = "https://smmkings.com/api/v2";
const STREAM_API_URL = "https://stream-promotion.com/api/v2";
const SMMKINGS_KEY = process.env.SMMKINGS_API_KEY || "";
const STREAM_KEY = process.env.STREAM_API_KEY || "";

export const syncOrderStatus = onSchedule(
  {
    schedule: "every 10 minutes",
    timeZone: "Asia/Seoul",
  },
  async () => {
    console.log("⏰ 주문 상태 동기화 시작");

    const snapshot = await db
      .collection("orders_external")
      .where("status", "!=", "완료됨")
      .get();

    await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const { externalOrderId, provider } = data;
        if (!externalOrderId || !provider) return;

        const endpoint = provider === "smmkings" ? SMMKINGS_API_URL : STREAM_API_URL;
        const key = provider === "smmkings" ? SMMKINGS_KEY : STREAM_KEY;

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key,
              action: "status",
              order: externalOrderId,
            }),
          });

          const json = await res.json();

          if (json.status) {
            await docSnap.ref.update({
              status: json.status,
              lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✅ ${docSnap.id}: 상태 → ${json.status}`);
          }
        } catch (err) {
          console.error(`❌ ${docSnap.id} 상태 조회 실패:`, err);
        }
      })
    );
  }
);