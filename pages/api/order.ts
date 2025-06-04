import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { service, link, quantity, comments } = req.body;

  // 주문 payload 기본값
  const payload: any = {
    key: process.env.NEXT_PUBLIC_SMMKINGS_API_KEY,
    action: "add",
    service,
    link,
    quantity,
  };

  // type이 Custom Comments인 경우, comments 필드 포함
  if (comments) {
    payload.comments = comments;
  }

  const response = await fetch("https://smmkings.com/api/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return res.status(200).json(data);
}