import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

const SMMKINGS_API_URL = "https://smmkings.com/api/v2";
const STREAM_API_URL = "https://stream-promotion.com/api/v2";

const SMMKINGS_KEY = process.env.NEXT_PUBLIC_SMMKINGS_API_KEY || "";
const STREAM_KEY = process.env.STREAM_API_KEY || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = query(collection(db, "orders_external"), where("status", "!=", "완료됨"));
    const snapshot = await getDocs(q);

    const updates = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const { externalOrderId, provider } = data;

      if (!externalOrderId || !provider) return null;

      let apiResponse;
      try {
        const endpoint = provider === "smmkings" ? SMMKINGS_API_URL : STREAM_API_URL;
        const key = provider === "smmkings" ? SMMKINGS_KEY : STREAM_KEY;

        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            action: "status",
            order: externalOrderId,
          }),
        });

        apiResponse = await resp.json();

        if (!apiResponse || typeof apiResponse.status !== "string") {
          console.warn(`Invalid response for order ${externalOrderId}`);
          return null;
        }

        // 상태 업데이트
        await updateDoc(doc(db, "orders_external", docSnap.id), {
          status: apiResponse.status,
          lastCheckedAt: new Date(),
        });

        return { id: docSnap.id, status: apiResponse.status };
      } catch (err) {
        console.error(`Error checking status for order ${externalOrderId}:`, err);
        return null;
      }
    }));

    res.status(200).json({
      updated: updates.filter(Boolean),
    });
  } catch (error) {
    console.error("Status sync failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}