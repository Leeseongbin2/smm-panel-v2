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
  Box,
  TextField,
  Button,
  Modal,
  CircularProgress,
} from "@mui/material";
import { db, auth } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/DashboardLayout";

export default function DistributorDashboard() {
  const { user } = useUserContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [withdrawInfo, setWithdrawInfo] = useState({ amount: 0, bank: "", account: "", name: "" });
  const [newUserInfo, setNewUserInfo] = useState({ email: "", password: "", name: "" });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    if (user?.uid) {
      checkAccess();
    }
  }, [user]);

  const checkAccess = async () => {
    if (!user?.uid) return;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = snap.data();
    if (!data?.isDistributor) {
      alert("총판 전용 페이지입니다.");
      router.replace("/");
    } else {
      await fetchChildren();
      await fetchWithdrawals();
      await fetchEarnings();
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    if (!user?.uid) return;
    const q = query(collection(db, "users"), where("referrerUid", "==", user.uid));
    const snapshot = await getDocs(q);
    const childUsers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as { id: string; email: string; totalSpent?: number }[];

    const processed = childUsers.map((child) => {
      const spent = child.totalSpent ?? 0;
      const commissionRate = 0.2;
      return {
        ...child,
        spent,
        commissionRate,
        commission: Math.floor(spent * commissionRate),
      };
    });

    setChildren(processed);
  };

  const fetchWithdrawals = async () => {
    if (!user?.uid) return;
    const q = query(collection(db, "withdrawal_requests"), where("distributorUid", "==", user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setWithdrawals(data);
  };

  const fetchEarnings = async () => {
    if (!user?.uid) return;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = snap.data();
    setTotalEarnings(data?.earnings ?? 0);
  };

    const handleWithdraw = async () => {
    if (!user?.uid) return;

    if (withdrawInfo.amount <= 0) {
        alert("❌ 0원 이하의 금액은 신청할 수 없습니다.");
        return;
    }

    if (withdrawInfo.amount > totalEarnings) {
        alert(`❌ 현재 수익금(${totalEarnings.toLocaleString()}원)보다 많은 금액은 신청할 수 없습니다.`);
        return;
    }

    const confirmed = window.confirm("정말 환급 신청하시겠습니까?");
    if (!confirmed) return;

    try {
        await addDoc(collection(db, "withdrawal_requests"), {
        distributorUid: user.uid,
        ...withdrawInfo,
        status: "대기중",
        createdAt: serverTimestamp(),
        });
        alert("✅ 환급 신청 완료");
        setShowWithdrawModal(false);
        fetchWithdrawals();
    } catch (err) {
        alert("❌ 실패: " + (err as any).message);
    }
    };

  const handleCreateUser = async () => {
    if (!user?.uid) return;
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        newUserInfo.email,
        newUserInfo.password
      );
      const uid = credential.user.uid;
      await setDoc(doc(db, "users", uid), {
        email: newUserInfo.email,
        name: newUserInfo.name,
        referrerUid: user.uid,
        isDistributor: false,
        points: 0,
        totalSpent: 0,
        createdAt: serverTimestamp(),
      });
      alert("✅ 하위 회원 생성 완료");
      setShowCreateModal(false);
      setNewUserInfo({ email: "", password: "", name: "" });
      fetchChildren();
    } catch (err) {
      alert("❌ 생성 실패: " + (err as any).message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout>
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          총판 대시보드
        </Typography>

        <Typography variant="h6" gutterBottom>
          🧾 총 수익금: {totalEarnings.toLocaleString()} 원
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Button variant="contained" onClick={() => setShowWithdrawModal(true)}>
            💸 환급 신청하기
          </Button>
          <Button variant="outlined" onClick={() => setShowCreateModal(true)}>
            👤 하위 회원 생성
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>회원 이메일</TableCell>
                <TableCell align="right">총 결제금액</TableCell>
                <TableCell align="right">수수료율</TableCell>
                <TableCell align="right">수익금</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {children.map((child) => (
                <TableRow key={child.id}>
                  <TableCell>{child.email}</TableCell>
                  <TableCell align="right">{child.spent.toLocaleString()} 원</TableCell>
                  <TableCell align="right">{(child.commissionRate * 100).toFixed(0)}%</TableCell>
                  <TableCell align="right">{child.commission.toLocaleString()} 원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" gutterBottom>
          📋 환급 신청 내역
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>신청일</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.createdAt?.toDate().toLocaleDateString() ?? "-"}</TableCell>
                  <TableCell>{w.amount.toLocaleString()} 원</TableCell>
                  <TableCell>{w.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Modal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)}>
          <Box sx={{ ...modalStyle }}>
            <Typography variant="h6" gutterBottom>환급 신청</Typography>
            <TextField fullWidth label="환급 금액" type="number" value={withdrawInfo.amount} onChange={(e) => setWithdrawInfo({ ...withdrawInfo, amount: Number(e.target.value) })} sx={{ mb: 2 }} />
            <TextField fullWidth label="입금 은행" value={withdrawInfo.bank} onChange={(e) => setWithdrawInfo({ ...withdrawInfo, bank: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="계좌 번호" value={withdrawInfo.account} onChange={(e) => setWithdrawInfo({ ...withdrawInfo, account: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="예금주 성함" value={withdrawInfo.name} onChange={(e) => setWithdrawInfo({ ...withdrawInfo, name: e.target.value })} sx={{ mb: 3 }} />
            <Button variant="contained" fullWidth onClick={handleWithdraw}>신청하기</Button>
          </Box>
        </Modal>

        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <Box sx={{ ...modalStyle }}>
            <Typography variant="h6" gutterBottom>하위 회원 생성</Typography>
            <TextField fullWidth label="이메일" value={newUserInfo.email} onChange={(e) => setNewUserInfo({ ...newUserInfo, email: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="이름" value={newUserInfo.name} onChange={(e) => setNewUserInfo({ ...newUserInfo, name: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="비밀번호" type="password" value={newUserInfo.password} onChange={(e) => setNewUserInfo({ ...newUserInfo, password: e.target.value })} sx={{ mb: 3 }} />
            <Button variant="contained" fullWidth onClick={handleCreateUser}>생성하기</Button>
          </Box>
        </Modal>
      </Container>
    </DashboardLayout>
  );
}

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};
