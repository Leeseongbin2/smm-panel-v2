import type { NextApiRequest, NextApiResponse } from "next";
import { sendSms } from "@/lib/sendSms";

/**
 * POST /api/send-sms
 * @body to: string (수신자 번호, 예: "01012345678")
 * @body content: string (문자 내용)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 허용 메서드 제한
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { to, content } = req.body;

  // 유효성 검사
  if (typeof to !== "string" || typeof content !== "string") {
    return res.status(400).json({
      success: false,
      message: "유효하지 않은 요청입니다. 'to'와 'content'는 문자열이어야 합니다.",
    });
  }

  try {
    const result = await sendSms(to, content);
    return res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error("❌ 문자 발송 실패:", error);
    return res.status(500).json({
      success: false,
      message: "서버 내부 오류로 문자 발송에 실패했습니다.",
      error: error?.message || "Unknown error",
    });
  }
}