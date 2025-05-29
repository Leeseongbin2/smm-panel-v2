import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import AdminLayout from "@/components/AdminLayout";
import {
  Box,
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
  Select,
  MenuItem,
  FormControl,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface ChargeRequest {
  id: string;
  userId: string;
  email: string;
  amount: number;
  depositor: string;
  status: string;
  createdAt: Timestamp;
}

export default function AdminPointsPage() {
  const [requests, setRequests] = useState<ChargeRequest[]>([]);
  const [filtered, setFiltered] = useState<ChargeRequest[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  const fetchRequests = async () => {
    const snapshot = await getDocs(collection(db, "chargeRequests"));
    const data = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data();
      return {
        id: docSnap.id,
        userId: raw.userId || "",
        email: raw.email || "",
        amount: raw.amount || 0,
        depositor: raw.depositor || "",
        status: raw.status || "대기중",
        createdAt: raw.createdAt || Timestamp.now(),
      };
    });
    setRequests(data);
    setFiltered(data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    const requestRef = doc(db, "chargeRequests", id);
    await updateDoc(requestRef, { status });
    fetchRequests();
  };

  const handleApprove = async (req: ChargeRequest) => {
    const userRef = doc(db, "users", req.userId);
    const requestRef = doc(db, "chargeRequests", req.id);

    try {
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const currentPoints = userSnap.exists() ? userSnap.data().points || 0 : 0;
        transaction.update(userRef, { points: currentPoints + req.amount });
        transaction.update(requestRef, { status: "승인됨" });
      });
      alert("✅ 포인트 지급 완료");
      fetchRequests();
    } catch (error) {
      alert("❌ 지급 실패: " + (error as any).message);
    }
  };

  const handleDelete = async (req: ChargeRequest) => {
    if (req.status === "승인됨") {
      alert("지급완료된 요청은 삭제할 수 없습니다.");
      return;
    }
    const confirm = window.confirm("정말로 해당 데이터를 삭제하시겠습니까?");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "chargeRequests", req.id));
      alert("🗑️ 삭제 완료");
      fetchRequests();
    } catch (error) {
      alert("❌ 삭제 실패: " + (error as any).message);
    }
  };

  const handleSearch = () => {
    const result = requests.filter((r) => {
      const matchEmail = r.email.includes(search);
      const matchDepositor = r.depositor.includes(search);
      const matchDate = (!startDate || dayjs(r.createdAt.toDate()).isAfter(startDate.subtract(1, 'day')))
        && (!endDate || dayjs(r.createdAt.toDate()).isBefore(endDate.add(1, 'day')));
      return (matchEmail || matchDepositor) && matchDate;
    });
    setFiltered(result);
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ my: 3 }}>
          📋 포인트 충전 요청 관리
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            label="회원 이메일 또는 입금자명"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="시작일"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePicker
              label="종료일"
              value={endDate}
              onChange={setEndDate}
            />
          </LocalizationProvider>
          <Button variant="contained" onClick={handleSearch}>
            검색
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }}>
          <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: 700, wordBreak: "keep-all" }}>
            <TableHead>
              <TableRow>
                <TableCell>신청일시</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>입금자명</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>지급</TableCell>
                <TableCell>삭제</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    {req.createdAt ? dayjs(req.createdAt.toDate()).format("YYYY-MM-DD HH:mm") : "-"}
                  </TableCell>
                  <TableCell>{req.email}</TableCell>
                  <TableCell>{req.amount.toLocaleString()}원</TableCell>
                  <TableCell>{req.depositor}</TableCell>
                  <TableCell>
                    <FormControl size="small">
                      <Select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                      >
                        <MenuItem value="대기중">대기중</MenuItem>
                        <MenuItem value="승인됨">지급완료</MenuItem>
                        <MenuItem value="거절됨">지급거절</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {req.status === "대기중" && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleApprove(req)}
                      >
                        지급
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(req)}
                    >
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </AdminLayout>
  );
}