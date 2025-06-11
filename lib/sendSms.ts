import axios from "axios";
import crypto from "crypto";

/**
 * 네이버 클라우드 SMS 문자 발송 함수 (SMS/LMS 자동 전환 포함)
 * @param to 수신자 전화번호 (예: 01012345678)
 * @param content 문자 내용
 */
export async function sendSms(to: string, content: string) {
  if (!to || !content || typeof content !== "string") {
    throw new Error("수신번호 또는 메시지 내용이 유효하지 않습니다.");
  }

  // ✅ 환경변수 로딩
  const serviceId = process.env.NCP_SMS_SERVICE_ID;
  const accessKey = process.env.NCP_ACCESS_KEY;
  const secretKey = process.env.NCP_SECRET_KEY;
  const sender = process.env.NCP_SMS_SENDER;

  // ✅ 디버깅 로그 (초기화 문제 확인용)
  console.log("🔐 ENV 확인:", {
    serviceId,
    accessKey,
    secretKey: secretKey ? "***HIDDEN***" : undefined,
    sender,
  });

  // ✅ 방어 코드: 환경변수 누락 시 에러
  if (!serviceId || !accessKey || !secretKey || !sender) {
    throw new Error("필수 환경변수가 누락되었습니다. .env.local을 확인하세요.");
  }

  // ✅ 바이트 길이에 따라 LMS 전환
  const byteLength = new TextEncoder().encode(content).length;
  const isLMS = byteLength > 90;

  const timestamp = Date.now().toString();
  const method = "POST";
  const url = `/sms/v2/services/${serviceId}/messages`;
  const fullUrl = `https://sens.apigw.ntruss.com${url}`;

  // ✅ 서명 생성
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${method} ${url}\n${timestamp}\n${accessKey}`)
    .digest("base64");

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "x-ncp-apigw-timestamp": timestamp,
    "x-ncp-iam-access-key": accessKey,
    "x-ncp-apigw-signature-v2": signature,
  };

  const body = {
    type: isLMS ? "LMS" : "SMS",
    contentType: "COMM",
    countryCode: "82",
    from: sender,
    subject: isLMS ? "쿠폰 안내" : undefined, // LMS는 제목 필수
    content,
    messages: [{ to }],
  };

  try {
    const res = await axios.post(fullUrl, body, { headers });
    console.log("✅ 문자 전송 성공:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ 문자 전송 실패:", err?.response?.data || err.message);
    throw new Error("문자 발송 중 오류가 발생했습니다.");
  }
}