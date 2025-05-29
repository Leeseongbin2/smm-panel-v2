// 📁 파일: pages/admin/userspoints.tsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import AdminLayout from "@/components/AdminLayout";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Button,
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

interface UserData {
  id: string;
  email: string;
  points: number;
}

export default function UsersPointsPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isAdd, setIsAdd] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const data = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data();
      return {
        id: docSnap.id,
        email: raw.email || "",
        points: raw.points || 0,
      };
    });
    const sorted = data.sort((a, b) => b.points - a.points);
    setUsers(sorted);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
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

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <Container maxWidth="md">

        <TextField
          fullWidth
          label="이메일로 회원 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />

        <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>이메일</TableCell>
                <TableCell align="right">현재 포인트</TableCell>
                <TableCell align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell align="right">{user.points.toLocaleString()} 원</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedUser(user)}
                    >
                      포인트 관리
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {selectedUser && (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedUser.email} 님의 포인트 관리
            </Typography>

            <RadioGroup
              row
              value={isAdd ? "add" : "subtract"}
              onChange={(e) => setIsAdd(e.target.value === "add")}
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="add" control={<Radio />} label="포인트 증가" />
              <FormControlLabel value="subtract" control={<Radio />} label="포인트 차감" />
            </RadioGroup>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                label="변경할 포인트"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <Button variant="contained" onClick={handleSubmit}>
                적용
              </Button>
              <Button onClick={() => setSelectedUser(null)}>
                취소
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </AdminLayout>
  );
}