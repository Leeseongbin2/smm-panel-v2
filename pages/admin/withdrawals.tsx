import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
} from "@mui/material";
import AdminLayout from "@/components/AdminLayout";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import dayjs from "dayjs";

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const fetchRequests = async () => {
    const snapshot = await getDocs(collection(db, "withdrawal_requests"));
    const data = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const raw = docSnap.data();
        const userSnap = await getDoc(doc(db, "users", raw.distributorUid));
        const userData = userSnap.data();
        return {
          id: docSnap.id,
          ...raw,
          email: userData?.email || "",
          earnings: userData?.earnings || 0,
          createdAt: raw.createdAt?.toDate(),
        };
      })
    );
    setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, uid: string, amount: number, action: "승인" | "거절") => {
    const reqRef = doc(db, "withdrawal_requests", id);
    await updateDoc(reqRef, { status: action });

    if (action === "승인") {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const currentEarnings = userData?.earnings || 0;
      await updateDoc(userRef, {
        earnings: Math.max(currentEarnings - amount, 0),
      });
    }

    fetchRequests();
  };

  const filtered = requests.filter((r) => {
    const matchEmail = searchEmail ? r.email.includes(searchEmail) : true;
    const matchDate = searchDate
      ? dayjs(r.createdAt).format("YYYY-MM-DD") === searchDate
      : true;
    return matchEmail && matchDate;
  });

  const distributorSummaries = Object.values(
    requests.reduce((acc: any, r) => {
      if (!acc[r.distributorUid]) {
        acc[r.distributorUid] = {
          email: r.email,
          uid: r.distributorUid,
          totalRequested: 0,
          earnings: r.earnings,
        };
      }
      acc[r.distributorUid].totalRequested += r.amount;
      return acc;
    }, {})
  );

return (
  <AdminLayout>
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        환급 요청 승인 관리
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="회원 이메일 검색"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <TextField
          label="날짜 (YYYY-MM-DD)"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>회원 이메일</TableCell>
              <TableCell>신청일</TableCell>
              <TableCell>금액</TableCell>
              <TableCell>입금 은행</TableCell>
              <TableCell>계좌</TableCell>
              <TableCell>예금주</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="center">처리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.email}</TableCell>
                <TableCell>{dayjs(r.createdAt).format("YYYY-MM-DD")}</TableCell>
                <TableCell>{r.amount.toLocaleString()} 원</TableCell>
                <TableCell>{r.bank}</TableCell>
                <TableCell>{r.account}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell align="center">
                {r.status === "대기중" ? (
                    <>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleAction(r.id, r.distributorUid, r.amount, "승인")}
                        sx={{ mr: 1 }}
                    >
                        승인
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAction(r.id, r.distributorUid, r.amount, "거절")}
                    >
                        거절
                    </Button>
                    </>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                    {r.status}됨
                    </Typography>
                )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" gutterBottom>
        총판별 수익 요약
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>총판 이메일</TableCell>
              <TableCell align="right">현재 수익금</TableCell>
              <TableCell align="right">누적 환급 신청금액</TableCell>
            </TableRow>
          </TableHead>
            <TableBody>
            {distributorSummaries.map((summary: any) => (
                <TableRow key={summary.uid}>
                <TableCell>{summary.email}</TableCell>
                <TableCell align="right">{summary.earnings.toLocaleString()} 원</TableCell>
                <TableCell align="right">{summary.totalRequested.toLocaleString()} 원</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      </TableContainer>
    </Container>
  </AdminLayout>
)};