// pages/admin/users.tsx
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Modal,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Chip,
  Collapse,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { auth, db } from "../../lib/firebaseClient";
import AdminLayout from "../../components/AdminLayout";
import axios from "axios";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isAdd, setIsAdd] = useState(true);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const confirmed = window.confirm("해당 정보로 회원을 생성하시겠습니까?");
    if (!confirmed) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;
      await setDoc(doc(db, "users", userId), {
        email,
        name,
        points: 0,
        isDistributor: false,
        referrerUid: null,
      });
      alert("✅ 회원이 성공적으로 생성되었습니다.");
      setShowModal(false);
      setEmail("");
      setPassword("");
      setName("");
      fetchUsers();
    } catch (error: any) {
      alert("❌ 오류 발생: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm("정말 이 회원을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await axios.post("/api/admin-delete-user", { uid: userId });
      await deleteDoc(doc(db, "users", userId));
      alert("✅ 회원이 삭제되었습니다.");
      fetchUsers();
    } catch (err: any) {
      alert("❌ 삭제 실패: " + err.message);
    }
  };

  const toggleDistributor = async (userId: string, isDistributor: boolean) => {
    const confirmed = window.confirm(
      isDistributor ? "총판 권한을 해제하시겠습니까?" : "총판 권한을 부여하시겠습니까?"
    );
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        isDistributor: !isDistributor,
      });
      fetchUsers();
    } catch (err: any) {
      alert("❌ 총판 권한 변경 실패: " + err.message);
    }
  };

  const handlePointSubmit = async () => {
    if (!selectedUser) return;
    const userRef = doc(db, "users", selectedUser.id);
    try {
      const newPoints = isAdd
        ? selectedUser.points + amount
        : Math.max(selectedUser.points - amount, 0);
      await updateDoc(userRef, { points: newPoints });
      alert("✅ 포인트 업데이트 완료");
      setSelectedUser(null);
      setAmount(0);
      fetchUsers();
    } catch (err) {
      alert("❌ 실패: " + (err as any).message);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) &&
      !user.referrerUid
  );

  const getChildUsers = (uid: string) => {
    return users.filter((u) => u.referrerUid === uid);
  };

  return (
    <AdminLayout>
      <Container sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">회원 목록</Typography>
          <Button variant="contained" onClick={() => setShowModal(true)}>
            ➕ 회원 생성
          </Button>
        </Box>

        <TextField
          fullWidth
          label="이메일로 회원 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />

        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>UID</TableCell>
                <TableCell>총판여부</TableCell>
                <TableCell>포인트</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <>
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.isDistributor && (
                        <IconButton size="small" onClick={() => setExpandedUid(expandedUid === user.id ? null : user.id)}>
                          {expandedUid === user.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isDistributor ? "총판" : "일반"}
                        color={user.isDistributor ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.points ?? 0}</TableCell>
                    <TableCell>
                      <Button size="small" color="error" onClick={() => handleDeleteUser(user.id)} sx={{ mr: 1 }}>
                        삭제
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => toggleDistributor(user.id, user.isDistributor)} sx={{ mr: 1 }}>
                        {user.isDistributor ? "총판 해제" : "총판 지정"}
                      </Button>
                      <Button size="small" variant="contained" onClick={() => setSelectedUser(user)}>
                        포인트 관리
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandedUid === user.id && (
                    getChildUsers(user.id).map((child) => (
                      <TableRow key={child.id} sx={{ backgroundColor: "#f9f9f9" }}>
                        <TableCell>↳</TableCell>
                        <TableCell>{child.email}</TableCell>
                        <TableCell>{child.name}</TableCell>
                        <TableCell>{child.id}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{child.points ?? 0}</TableCell>
                        <TableCell>
                          <Button size="small" color="error" onClick={() => handleDeleteUser(child.id)} sx={{ mr: 1 }}>
                            삭제
                          </Button>
                          <Button size="small" variant="contained" onClick={() => setSelectedUser(child)}>
                            포인트 관리
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {selectedUser && (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedUser.email} 님의 포인트 관리
            </Typography>
            <RadioGroup row value={isAdd ? "add" : "subtract"} onChange={(e) => setIsAdd(e.target.value === "add")} sx={{ mb: 2 }}>
              <FormControlLabel value="add" control={<Radio />} label="포인트 증가" />
              <FormControlLabel value="subtract" control={<Radio />} label="포인트 차감" />
            </RadioGroup>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField label="변경할 포인트" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              <Button variant="contained" onClick={handlePointSubmit}>적용</Button>
              <Button onClick={() => setSelectedUser(null)}>취소</Button>
            </Box>
          </Paper>
        )}

        <Modal open={showModal} onClose={() => setShowModal(false)}>
          <Box
            sx={{
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
            }}
          >
            <Typography variant="h6" mb={2}>회원 생성</Typography>
            <TextField fullWidth label="이메일" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="이름" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={handleCreateUser} variant="contained">생성</Button>
              <Button onClick={() => setShowModal(false)} variant="outlined">취소</Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </AdminLayout>
  );
}
