import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { service, link, quantity } = req.body;

  const response = await fetch("https://smmkings.com/api/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: process.env.NEXT_PUBLIC_SMMKINGS_API_KEY,
      action: "add",
      service,
      link,
      quantity,
    }),
  });

  const data = await response.json();
  return res.status(200).json(data);
}