import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminLayout from "@/components/AdminLayout";
import { db } from "@/lib/firebaseClient";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const tabLabels = ["네이버", "SNS"];

export default function AdminOrdersPage() {
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    handleSearchWithIndex(tabIndex);
  }, []);

  const getUserEmailMap = async (uids: string[]) => {
    const emailMap: Record<string, string> = {};
    for (const uid of uids) {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        emailMap[uid] = snap.data().email || "N/A";
      } else {
        emailMap[uid] = "N/A";
      }
    }
    return emailMap;
  };

  const handleTabChange = (_: any, newIndex: number) => {
    setTabIndex(newIndex);
    setOrders([]);
    handleSearchWithIndex(newIndex);
  };

  const handleSearch = () => {
    handleSearchWithIndex(tabIndex);
  };

  const handleSearchWithIndex = async (activeTabIndex: number) => {
    let userUid = "";

    if (email) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        userUid = snapshot.docs[0].id;
        setUid(userUid);
      } else {
        alert("해당 이메일로 등록된 사용자를 찾을 수 없습니다.");
        setUid("");
        setOrders([]);
        return;
      }
    } else {
      setUid("");
    }

    const collectionName = activeTabIndex === 0 ? "orders" : "orders_external";
    const ordersRef = collection(db, collectionName);

    const baseQuery = email
      ? query(ordersRef, where("userId", "==", userUid))
      : query(ordersRef, orderBy("createdAt", "desc"), limit(20));

    const orderSnapshot = await getDocs(baseQuery);
    const rawOrders = orderSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    const uniqueUids = [...new Set(rawOrders.map((order) => order.userId))];
    const emailMap = await getUserEmailMap(uniqueUids);

    const enrichedOrders = rawOrders.map((order) => ({
      ...order,
      email: emailMap[order.userId] || "N/A",
    }));

    setOrders(enrichedOrders);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const collectionName = tabIndex === 0 ? "orders" : "orders_external";
    const orderRef = doc(db, collectionName, orderId);
    await updateDoc(orderRef, { status: newStatus });

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleDelete = async (orderId: string) => {
    const collectionName = tabIndex === 0 ? "orders" : "orders_external";
    await deleteDoc(doc(db, collectionName, orderId));
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          관리자 주문내역 조회
        </Typography>

        <Box display="flex" gap={2} alignItems="center" mb={3} flexWrap="wrap">
          <TextField
            label="회원 이메일 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
          />
          <Button variant="contained" onClick={handleSearch} sx={{ whiteSpace: "nowrap" }}>
            조회
          </Button>
        </Box>

        <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabLabels.map((label, i) => (
            <Tab label={label} key={i} />
          ))}
        </Tabs>

        <Paper sx={{ mt: 3, width: "100%", overflowX: "auto" }}>
          <Table size={"small"} sx={{ minWidth: 800, wordBreak: "keep-all" }}>
            <TableHead>
              <TableRow>
                <TableCell>주문일자</TableCell>
                <TableCell>서비스명</TableCell>
                <TableCell>수량</TableCell>
                <TableCell>링크</TableCell>
                <TableCell>회원 이메일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>가이드라인</TableCell>
                <TableCell>삭제</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.createdAt?.toDate?.().toLocaleString?.() || "-"}
                  </TableCell>
                  <TableCell>{order.serviceName || "N/A"}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    <a href={order.link} target="_blank" rel="noopener noreferrer">
                      링크
                    </a>
                  </TableCell>
                  <TableCell>{order.email || "N/A"}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="대기">대기</MenuItem>
                      <MenuItem value="진행중">진행중</MenuItem>
                      <MenuItem value="완료">완료</MenuItem>
                      <MenuItem value="취소">취소</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {order.guideText ? (
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedGuide(order.guideText);
                          setGuideOpen(true);
                        }}
                      >
                        보기
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDelete(order.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>

      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>가이드라인 내용</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            {selectedGuide}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuideOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}