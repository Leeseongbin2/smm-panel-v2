import { useEffect, useState } from "react";
import { db } from "../../lib/firebaseClient";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Box,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardLayout from "../../components/DashboardLayout";
import { useUserContext } from "../../context/UserContext";

export default function TrafficHistory() {
  const { userEmail } = useUserContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "place" | "tmap">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchOrders = async (start?: Date, end?: Date) => {
    if (!userEmail) return;
    let q = query(
      collection(db, "traffic_orders"),
      where("userEmail", "==", userEmail),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    let result = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (start && end) {
      result = result.filter((o: any) => {
        const createdAt = o.createdAt?.toDate?.() || new Date();
        return createdAt >= start && createdAt <= end;
      });
    }

    setOrders(result);
  };

  useEffect(() => {
    const now = new Date();
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    fetchOrders(start, end);
  }, [userEmail]);

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    fetchOrders(start, end);
  };

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    return o.adType === filter;
  });

  return (
    <DashboardLayout>
      <Container sx={{ py: 4 }}>
        <Typography variant="h6" gutterBottom>
          내 트래픽 주문 내역
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
          }}
        >
          <Select
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "place" | "tmap")}
            fullWidth={isMobile}
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="place">플레이스</MenuItem>
            <MenuItem value="tmap">티맵</MenuItem>
          </Select>

          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
              width: isMobile ? "100%" : "auto",
            }}
          >
            <TextField
              size="small"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth={isMobile}
            />
            <TextField
              size="small"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth={isMobile}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              fullWidth={isMobile}
            >
              조회
            </Button>
          </Box>
        </Box>

        <Paper sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 700, wordBreak: "keep-all" }}>
            <TableHead>
              <TableRow>
                {filter === "tmap" ? (
                  <>
                    <TableCell>업체명</TableCell>
                    <TableCell>키워드</TableCell>
                    <TableCell>기간</TableCell>
                    <TableCell>총 유입수</TableCell>
                    <TableCell>총액</TableCell>
                    <TableCell>상태</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>광고유형</TableCell>
                    <TableCell>작업</TableCell>
                    <TableCell>키워드</TableCell>
                    <TableCell>링크</TableCell>
                    <TableCell>기간</TableCell>
                    <TableCell>총 유입수</TableCell>
                    <TableCell>총액</TableCell>
                    <TableCell>상태</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((order) => {
                const totalTraffic = order.dailyTraffic * (order.totalDays || 1);
                return filter === "tmap" || order.adType === "tmap" ? (
                  <TableRow key={order.id}>
                    <TableCell>{order.trackingKeyword}</TableCell>
                    <TableCell>{order.keywords}</TableCell>
                    <TableCell>{order.startDate} ~ {order.endDate}</TableCell>
                    <TableCell>{totalTraffic.toLocaleString()}</TableCell>
                    <TableCell>{order.totalPrice?.toLocaleString()}원</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={order.id}>
                    <TableCell>{order.adType}</TableCell>
                    <TableCell>{order.taskType}</TableCell>
                    <TableCell>{order.keywords}</TableCell>
                    <TableCell>
                      <a href={order.link} target="_blank" rel="noreferrer">링크</a>
                    </TableCell>
                    <TableCell>{order.startDate} ~ {order.endDate}</TableCell>
                    <TableCell>{totalTraffic.toLocaleString()}</TableCell>
                    <TableCell>{order.totalPrice?.toLocaleString()}원</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Container>
    </DashboardLayout>
  );
}