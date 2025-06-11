import { useEffect, useState } from "react";
import { db } from "../../lib/firebaseClient";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  MenuItem,
  Select,
  Button,
  TextField,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminLayout from "../../components/AdminLayout";
import * as XLSX from "xlsx";

export default function AdminTrafficOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "place" | "tmap">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const isMobile = useMediaQuery("(max-width:600px)");

  const fetchOrders = async (start: Date, end: Date) => {
    const q = query(
      collection(db, "traffic_orders"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end)),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const result = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOrders(result);
  };

  const resetToDefault = () => {
    const now = new Date();
    const end = new Date(now);
    const currentHour = now.getHours();

    if (currentHour < 16) {
      end.setDate(end.getDate() - 1);
    }

    end.setHours(16, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 1);

    fetchOrders(start, end);
    setStartDate("");
    setEndDate("");
  };

  useEffect(() => {
    resetToDefault();

    const deleteOld = async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const oldQuery = query(
        collection(db, "traffic_orders"),
        where("createdAt", "<", Timestamp.fromDate(ninetyDaysAgo))
      );
      const oldSnap = await getDocs(oldQuery);
      oldSnap.forEach(async (docItem) => {
        await deleteDoc(doc(db, "traffic_orders", docItem.id));
      });
    };
    deleteOld();
  }, []);

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    fetchOrders(start, end);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "traffic_orders", id), {
        status: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      alert("상태 변경 실패: " + error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "traffic_orders", id));
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      alert("삭제 실패: " + error);
    }
  };

  const handleExportExcel = () => {
    const data = orders.map((o) => ({
      광고유형: o.adType,
      작업: o.taskType || o.trackingKeyword,
      키워드: o.keywords,
      링크: o.link || "-",
      시작일: o.startDate,
      종료일: o.endDate,
      일트래픽: o.dailyTraffic,
      총액: o.totalPrice,
      상태: o.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "주문내역");
    XLSX.writeFile(workbook, "트래픽_주문_내역.xlsx");
  };

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    return o.adType === filter;
  });

  return (
    <AdminLayout>
      <Container sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          트래픽 주문 목록
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
          }}
        >
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, val) => val && setFilter(val)}
            fullWidth={isMobile}
          >
            <ToggleButton value="all">전체</ToggleButton>
            <ToggleButton value="place">플레이스</ToggleButton>
            <ToggleButton value="tmap">티맵</ToggleButton>
          </ToggleButtonGroup>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: isMobile ? "center" : "flex-end",
            }}
          >
            <TextField
              size="small"
              type="date"
              label="시작일"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              size="small"
              type="date"
              label="종료일"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button onClick={handleSearch} variant="contained">
              조회
            </Button>
            <Button onClick={resetToDefault} variant="outlined">
              목록 초기화
            </Button>
            <Button variant="outlined" onClick={handleExportExcel}>
              엑셀 다운로드
            </Button>
          </Box>
        </Box>

        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 800, wordBreak: "keep-all" }}>
            <TableHead>
              <TableRow>
                <TableCell>광고유형</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>작업</TableCell>
                <TableCell>키워드</TableCell>
                <TableCell>링크</TableCell>
                <TableCell>기간</TableCell>
                <TableCell>일트래픽</TableCell>
                <TableCell>총액</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>삭제</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.adType}</TableCell>
                  <TableCell>{order.userEmail || "-"}</TableCell>
                  <TableCell>{order.taskType || order.trackingKeyword}</TableCell>
                  <TableCell>{order.keywords}</TableCell>
                  <TableCell>
                    <a href={order.link} target="_blank" rel="noreferrer">링크</a>
                  </TableCell>
                  <TableCell>{order.startDate} ~ {order.endDate}</TableCell>
                  <TableCell>{order.dailyTraffic}</TableCell>
                  <TableCell>{order.totalPrice?.toLocaleString()}원</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={order.status || "대기"}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <MenuItem value="대기">대기</MenuItem>
                      <MenuItem value="진행">진행</MenuItem>
                      <MenuItem value="중단">중단</MenuItem>
                      <MenuItem value="마감">마감</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDelete(order.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>
    </AdminLayout>
  );
}
