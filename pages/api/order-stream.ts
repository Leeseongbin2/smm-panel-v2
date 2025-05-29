// pages/api/order-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";

const STREAM_API_URL = "https://stream-promotion.com/api/v2";
const STREAM_API_KEY = process.env.STREAM_API_KEY || ""; // .env에 반드시 설정 필요

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { service, link, quantity, comments } = req.body;

  if (!service || !link || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const payload: any = {
    key: STREAM_API_KEY,
    action: "add",
    service,
    link,
    quantity,
  };

  if (comments) {
    payload.comments = comments;
  }

  try {
    const response = await fetch(STREAM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.order) {
      return res.status(200).json({ order: result.order });
    } else {
      return res.status(400).json({ error: result });
    }
  } catch (error: any) {
    console.error("Stream API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}