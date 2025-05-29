// /dashboard/history.tsx
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useUserContext } from "@/context/UserContext";
import DashboardLayout from "@/components/DashboardLayout";
import dayjs, { Dayjs } from "dayjs";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Container,
  Grid,
  Alert,
  Button,
  Stack,
  useMediaQuery,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

interface OrderData {
  id: string;
  createdAt: Date;
  serviceName: string;
  provider: string;
  quantity: number;
  link: string;
  status: string;
}

export default function OrderHistory() {
  const { user } = useUserContext();
  const [naverOrders, setNaverOrders] = useState<OrderData[]>([]);
  const [snsOrders, setSnsOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(7, "day"));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState<"naver" | "sns">("naver");
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (!user?.uid) return;

    const fetchOrders = async () => {
      const now = dayjs();
      const ninetyDaysAgo = now.subtract(90, "day");

      const naverQuery = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const naverSnap = await getDocs(naverQuery);
      const tempNaver = naverSnap.docs
        .map((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() ?? new Date();
          if (
            dayjs(createdAt).isAfter(ninetyDaysAgo) &&
            dayjs(createdAt).isAfter(startDate.startOf("day")) &&
            dayjs(createdAt).isBefore(endDate.endOf("day"))
          ) {
            return {
              id: doc.id,
              createdAt,
              serviceName: data.serviceName ?? "알 수 없음",
              provider: data.provider ?? "manual",
              quantity: data.quantity,
              link: data.link,
              status: data.status ?? "대기중",
            };
          }
          return null;
        })
        .filter(Boolean);

      const snsQuery = query(
        collection(db, "orders_external"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snsSnap = await getDocs(snsQuery);
      const tempSns = snsSnap.docs
        .map((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() ?? new Date();
          if (
            dayjs(createdAt).isAfter(ninetyDaysAgo) &&
            dayjs(createdAt).isAfter(startDate.startOf("day")) &&
            dayjs(createdAt).isBefore(endDate.endOf("day"))
          ) {
            return {
              id: doc.id,
              createdAt,
              serviceName: data.serviceName ?? "알 수 없음",
              provider: data.provider ?? "",
              quantity: data.quantity,
              link: data.link,
              status: data.status ?? "대기중",
            };
          }
          return null;
        })
        .filter(Boolean);

      setNaverOrders(tempNaver as OrderData[]);
      setSnsOrders(tempSns as OrderData[]);
      setLoading(false);
    };

    fetchOrders();
  }, [user?.uid, startDate, endDate]);

  return (
    <DashboardLayout>
      <Container sx={{ mt: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          주문 데이터는 최근 <strong>90일</strong> 이내 항목만 조회 가능합니다.
        </Alert>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="시작일"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="종료일"
                value={endDate}
                onChange={(newValue) => newValue && setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Button
            fullWidth={isMobile}
            variant={activeTab === "naver" ? "contained" : "outlined"}
            onClick={() => setActiveTab("naver")}
          >
            네이버 리뷰 작업
          </Button>
          <Button
            fullWidth={isMobile}
            variant={activeTab === "sns" ? "contained" : "outlined"}
            onClick={() => setActiveTab("sns")}
          >
            SNS 서비스 작업
          </Button>
        </Stack>

        {loading ? (
          <CircularProgress />
        ) : (
          <Paper sx={{ width: "100%", overflow: "auto", bgcolor: "white" }}>
            <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>주문일시</TableCell>
                  <TableCell>서비스명</TableCell>
                  <TableCell>링크</TableCell>
                  <TableCell>수량</TableCell>
                  <TableCell>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeTab === "naver" ? naverOrders : snsOrders).map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.createdAt.toLocaleString("ko-KR")}</TableCell>
                    <TableCell>{order.serviceName}</TableCell>
                    <TableCell>
                      <a href={order.link} target="_blank" rel="noopener noreferrer">
                        {order.link.length > 30 ? order.link.slice(0, 30) + "..." : order.link}
                      </a>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>
    </DashboardLayout>
  );
}
