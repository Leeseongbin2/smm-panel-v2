// pages/dashboard/charge.tsx
import DashboardLayout from "../../components/DashboardLayout";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { useUserContext } from "@/context/UserContext";

export default function ChargePage() {
  const [amount, setAmount] = useState("");
  const [depositor, setDepositor] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const router = useRouter();
  const { user, userEmail } = useUserContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchHistory = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const currentPoints = userSnap.exists() ? userSnap.data().points || 0 : 0;

    const q = query(
      collection(db, "chargeRequests"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    let balance = currentPoints;
    const result = snapshot.docs.map((doc) => {
      const data = doc.data();
      const after = balance;
      const before = data.status === "승인됨" ? after - data.amount : after;
      if (data.status === "승인됨") {
        balance -= data.amount;
      }
      return {
        id: doc.id,
        ...data,
        before,
        after,
      };
    });

    setHistory(result.reverse());
  };

  useEffect(() => {
    if (user && userEmail) {
      fetchHistory(user.uid);
    }
  }, [user, userEmail]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const user = auth.currentUser;

  if (!user) {
    alert("로그인이 필요합니다.");
    router.push("/");
    return;
  }

  if (!amount || !depositor) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  try {
    // 🔹 1. Firestore에 충전 요청 저장
    await addDoc(collection(db, "chargeRequests"), {
      userId: user.uid,
      email: user.email,
      amount: Number(amount),
      depositor,
      status: "대기중",
      createdAt: serverTimestamp(),
    });

    // 🔹 2. 관리자에게 문자 전송
      await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "01056995311",
          content: "신규 포인트 충전 요청",
        }),
      });

    alert("💰 충전 요청이 접수되었습니다!");
    setAmount("");
    setDepositor("");
    fetchHistory(user.uid);
  } catch (err: any) {
    alert("❌ 오류 발생: " + err.message);
  }
};

  return (
    <DashboardLayout>
      <Container maxWidth="md" sx={{ px: isMobile ? 1 : 3 }}>
        <Box
          sx={{
            mb: 4,
            p: isMobile ? 2 : 3,
            backgroundColor: "#fef7e0",
            border: "1px solid #f4d27f",
            borderRadius: 2,
            fontSize: isMobile ? "0.85rem" : "1rem",
          }}
        >
          <Typography variant="body1" sx={{ mb: 1 }}>
            💡 <strong>충전 절차 안내</strong>
          </Typography>
          <Typography variant="body2">
            1️⃣ <strong>충전 요청</strong>을 먼저 등록해주세요.<br />
            2️⃣ 이후 <strong>카카오톡 문의하기</strong>를 통해 <strong>입금자명과 신청 금액</strong>을 전달해 주세요.<br />
            3️⃣ 관리자가 확인 후 포인트가 충전됩니다.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            ⏰ <strong>입금 가능 시간:</strong> 평일 오전 9시 ~ 오후 6시<br />
            그 외 시간에 입금하신 경우 <strong>처리까지 시간이 소요될 수 있습니다.</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            📄 <strong>전자세금계산서</strong>가 필요하신 경우,<br />
            사업자등록증과 이메일 주소를 함께 <strong>카카오톡 문의하기</strong>로 보내주세요.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            ⚠️ 절차대로 진행했으나 승인이 지연되거나 급한 문의가 있다면,<br />
            <strong>010-5699-5311</strong>로 연락 주시면 빠르게 도와드리겠습니다.
          </Typography>
        </Box>

        <Paper sx={{ p: isMobile ? 2 : 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            💸 잔액 충전 신청
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="충전 금액 (원)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="입금자명"
              value={depositor}
              onChange={(e) => setDepositor(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <Button fullWidth variant="contained" type="submit">
              충전 요청
            </Button>
          </form>
        </Paper>

        <Typography variant="h6" gutterBottom>
          📃 충전 신청 내역
        </Typography>
        <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }}>
          <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: 600, wordBreak: "keep-all" }}>
            <TableHead>
              <TableRow>
                <TableCell>신청일시</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>입금자명</TableCell>
                <TableCell>처리현황</TableCell>
                <TableCell>신청 전 잔액</TableCell>
                <TableCell>신청 후 잔액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.createdAt ? dayjs(item.createdAt.toDate()).format("YYYY-MM-DD HH:mm") : "-"}</TableCell>
                  <TableCell>{item.amount.toLocaleString()}원</TableCell>
                  <TableCell>{item.depositor}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.status}
                      color={item.status === "승인됨" ? "success" : item.status === "거절됨" ? "error" : "default"}
                    />
                  </TableCell>
                  <TableCell>{(item.before ?? 0).toLocaleString()}원</TableCell>
                  <TableCell>{(item.after ?? 0).toLocaleString()}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </DashboardLayout>
  );
}