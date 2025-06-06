import { useEffect, useState } from "react";
import {
  Box, Button, Container, TextField, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Alert
} from "@mui/material";
import { db } from "@/lib/firebaseClient";
import { useUserContext } from "@/context/UserContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  collection, query, where, getDocs, setDoc, doc, serverTimestamp,
  getDoc, updateDoc
} from "firebase/firestore";
import dayjs from "dayjs";

export default function LoyaltyPointsPage() {
  const { user } = useUserContext();
  const uid = user?.uid;

  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [useAmount, setUseAmount] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", referrerPhone: "", birthDate: "" });
  const [config, setConfig] = useState({ firstJoinBonus: 10000, referralBonus: 10000, paymentPercent: 5 });
  const [storeName, setStoreName] = useState("");
  const [message, setMessage] = useState("");

  // ⛔ 팝업용 에러 상태
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  const showError = (msg: string) => {
    setErrorDialogMessage(msg);
    setErrorDialogOpen(true);
  };

  useEffect(() => {
    if (uid) loadConfig();
  }, [uid]);

  const loadConfig = async () => {
    const configSnap = await getDoc(doc(db, `users/${uid}/settings/loyalty_config`));
    if (configSnap.exists()) setConfig(configSnap.data() as any);

    const storeSnap = await getDoc(doc(db, `users/${uid}/settings/store_info`));
    if (storeSnap.exists()) setStoreName(storeSnap.data().name);
  };

  const handleSearch = async () => {
    if (!uid || !searchPhone) return;
    const q = query(collection(db, `users/${uid}/loyal_customers`), where("phone", "==", searchPhone));
    const snap = await getDocs(q);
    if (!snap.empty) setSelectedCustomer({ id: snap.docs[0].id, ...snap.docs[0].data() });
    else setMessage("단골 정보를 찾을 수 없습니다.");
  };

  const handlePointReward = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    const amount = Number(paymentAmount);
    const reward = Math.floor(amount * (config.paymentPercent / 100));
    const ref = doc(db, `users/${uid}/loyal_customers/${selectedCustomer.id}`);
    await updateDoc(ref, {
      points: selectedCustomer.points + reward,
      visitCount: (selectedCustomer.visitCount || 0) + 1,
      lastVisit: serverTimestamp(),
      totalPayment: (selectedCustomer.totalPayment || 0) + amount
    });
    setMessage(`${reward}P 적립 완료`);
    setSelectedCustomer(null);
    setPaymentAmount("");
  };

  const handlePointUse = async () => {
    if (!selectedCustomer || !useAmount) return;
    const use = Number(useAmount);
    if (use > selectedCustomer.points) return showError("포인트가 부족합니다.");
    const ref = doc(db, `users/${uid}/loyal_customers/${selectedCustomer.id}`);
    await updateDoc(ref, {
      points: selectedCustomer.points - use,
      lastVisit: serverTimestamp(),
    });
    setMessage(`${use}P 사용 완료`);
    setSelectedCustomer(null);
    setUseAmount("");
  };

  const handleRegisterCustomer = async () => {
    const phone = form.phone.replace(/[^0-9]/g, "");
    if (!phone || !form.name) return showError("이름과 전화번호는 필수 입력 항목입니다.");

    const dup = await getDocs(query(collection(db, `users/${uid}/loyal_customers`), where("phone", "==", phone)));
    if (!dup.empty) return showError("이미 등록된 전화번호입니다.");

    if (form.referrerPhone) {
      const refQ = await getDocs(query(collection(db, `users/${uid}/loyal_customers`), where("phone", "==", form.referrerPhone)));
      if (!refQ.empty) {
        const refDoc = refQ.docs[0];
        await updateDoc(refDoc.ref, {
          points: (refDoc.data().points || 0) + config.referralBonus,
        });
      }
    }

    await setDoc(doc(collection(db, `users/${uid}/loyal_customers`)), {
      name: form.name,
      phone,
      referrerPhone: form.referrerPhone || null,
      birthDate: form.birthDate || null,
      points: config.firstJoinBonus,
      visitCount: 1,
      totalPayment: 0,
      createdAt: serverTimestamp(),
      lastVisit: serverTimestamp(),
      note: ""
    });

    setForm({ name: "", phone: "", referrerPhone: "", birthDate: "" });
    setRegisterDialogOpen(false);
    setMessage("단골이 등록되었습니다.");
  };

  const handleSaveConfig = async () => {
    await setDoc(doc(db, `users/${uid}/settings/loyalty_config`), config);
    await setDoc(doc(db, `users/${uid}/settings/store_info`), { name: storeName });
    setConfigOpen(false);
    setMessage("설정이 저장되었습니다.");
  };

  return (
    <DashboardLayout>
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={() => setRegisterDialogOpen(true)}>단골 등록</Button>
          <Button variant="outlined" onClick={() => setConfigOpen(true)}>설정 변경</Button>
        </Box>

        <TextField
          fullWidth label="전화번호 입력"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
          sx={{ mb: 2 }}
        />

        {selectedCustomer && (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: "#f9f9fc" }}>
            <Typography variant="h6" gutterBottom>👤 {selectedCustomer.name} 님</Typography>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}>
              <Paper sx={{ flex: 1, p: 2, textAlign: "center", backgroundColor: "#fffbe6" }}>
                <Typography variant="subtitle2">포인트</Typography>
                <Typography variant="h6">{selectedCustomer.points}P</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, textAlign: "center", backgroundColor: "#e6f7ff" }}>
                <Typography variant="subtitle2">방문 횟수</Typography>
                <Typography variant="h6">{selectedCustomer.visitCount}회</Typography>
              </Paper>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center", mt: 2 }}>
              <TextField
                fullWidth
                label="결제금액"
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
              <Button
                variant="contained"
                color="success"
                onClick={handlePointReward}
                sx={{ height: "56px", whiteSpace: "nowrap", px: 2 }}
              >
                포인트 적립
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center", mt: 2 }}>
              <TextField
                fullWidth
                label="사용할 포인트"
                type="number"
                value={useAmount}
                onChange={e => setUseAmount(e.target.value)}
              />
              <Button
                variant="contained"
                color="error"
                onClick={handlePointUse}
                sx={{ height: "56px", whiteSpace: "nowrap", px: 2 }}
              >
                포인트 사용
              </Button>
            </Box>
          </Paper>
        )}

        {message && <Alert severity="info" sx={{ mt: 3 }}>{message}</Alert>}

        {/* 단골 등록 Dialog */}
        <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)}>
          <DialogTitle>단골 등록</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
            <TextField fullWidth label="전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} margin="normal" />
            <TextField fullWidth label="추천인 전화번호 (선택)" value={form.referrerPhone} onChange={(e) => setForm({ ...form, referrerPhone: e.target.value })} margin="normal" />
            <TextField fullWidth label="생일 (YYYY-MM-DD)" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} margin="normal" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegisterDialogOpen(false)}>취소</Button>
            <Button variant="contained" onClick={handleRegisterCustomer}>등록</Button>
          </DialogActions>
        </Dialog>

        {/* 설정 변경 Dialog */}
        <Dialog open={configOpen} onClose={() => setConfigOpen(false)}>
          <DialogTitle>설정 변경</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="가입 포인트" type="number" value={config.firstJoinBonus} onChange={(e) => setConfig({ ...config, firstJoinBonus: Number(e.target.value) })} margin="normal" />
            <TextField fullWidth label="추천 포인트" type="number" value={config.referralBonus} onChange={(e) => setConfig({ ...config, referralBonus: Number(e.target.value) })} margin="normal" />
            <TextField fullWidth label="결제 적립률 (%)" type="number" value={config.paymentPercent} onChange={(e) => setConfig({ ...config, paymentPercent: Number(e.target.value) })} margin="normal" />
            <TextField fullWidth label="업체명" value={storeName} onChange={(e) => setStoreName(e.target.value)} margin="normal" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfigOpen(false)}>취소</Button>
            <Button variant="contained" onClick={handleSaveConfig}>저장</Button>
          </DialogActions>
        </Dialog>

        {/* 오류 팝업 Dialog */}
        <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
          <DialogTitle>🚫 오류</DialogTitle>
          <DialogContent>
            <Typography>{errorDialogMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setErrorDialogOpen(false)} autoFocus>확인</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}